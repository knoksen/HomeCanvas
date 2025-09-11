/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { descriptionCache, hashString } from './cache';
import { persistentDescriptionCache } from './persistentCache';
import { 
    getImageDimensions, 
    cropToOriginalAspectRatio, 
    resizeImage, 
    fileToPart, 
    fileToDataUrl, 
    markImage 
} from './imageUtils';


/**
 * Generates a composite image using a multi-modal AI model.
 * The model takes a product image, a scene image, and a text prompt
 * to generate a new image with the product placed in the scene.
 * @param objectImage The file for the object to be placed.
 * @param objectDescription A text description of the object.
 * @param environmentImage The file for the background environment.
 * @param environmentDescription A text description of the environment.
 * @param dropPosition The relative x/y coordinates (0-100) where the product was dropped.
 * @returns A promise that resolves to an object containing the base64 data URL of the generated image and the debug image.
 */
export const generateCompositeImage = async (
    objectImage: File, 
    objectDescription: string,
    environmentImage: File,
    environmentDescription: string,
    dropPosition: { xPercent: number; yPercent: number; }
): Promise<{ finalImageUrl: string; debugImageUrl: string; finalPrompt: string; }> => {
  console.log('Starting multi-step image generation process...');
  const apiKey = (process.env.API_KEY as string | undefined) ?? (process.env.GEMINI_API_KEY as string | undefined);
  const useProxy = (typeof window !== 'undefined' && ( (import.meta as any).env?.VITE_USE_PROXY === 'true' )) || !apiKey;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : undefined;
  if (!apiKey && !useProxy) {
    throw new Error('Missing GEMINI_API_KEY and proxy not enabled. Provide a key or set VITE_USE_PROXY=true and run the local proxy.');
  }

  const callModel = async (model: string, parts: any[]): Promise<any> => {
    if (!useProxy && ai) {
      return ai.models.generateContent({ model, contents: { parts } });
    }
    // Proxy path (supports optional base URL for hosted proxy)
    const base = (typeof window !== 'undefined' && (window as any).ENV_PROXY_BASE_URL) 
      || (import.meta as any).env?.VITE_PROXY_BASE_URL 
      || '';
    const token = (import.meta as any).env?.VITE_PROXY_ACCESS_TOKEN;
    const res = await fetch(`${base}/api/gemini/${model}`.replace(/\/\/+/g,'/'), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ contents: [{ parts }] })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Proxy model call failed (${res.status}): ${text}`);
    }
    return res.json();
  };

  // Get original scene dimensions for final cropping and correct marker placement
  const { width: originalWidth, height: originalHeight } = await getImageDimensions(environmentImage);
  
  // Define standard dimension for model inputs
  const MAX_DIMENSION = 1024;
  
  // STEP 1: Prepare images by resizing
  console.log('Resizing product and scene images...');
  const resizedObjectImage = await resizeImage(objectImage, MAX_DIMENSION);
  const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);

  // STEP 2: Mark the resized scene image for the description model and debug view
  console.log('Marking scene image for analysis...');
  // Pass original dimensions to correctly calculate marker position on the padded image
  const markedResizedEnvironmentImage = await markImage(resizedEnvironmentImage, dropPosition, { originalWidth, originalHeight });

  // The debug image is now the marked one.
  const debugImageUrl = await fileToDataUrl(markedResizedEnvironmentImage);


  // STEP 3: Generate semantic location description with Gemini 2.5 Flash using the MARKED image
  console.log('Generating semantic location description with gemini-2.5-flash...');
  
  const markedEnvironmentImagePart = await fileToPart(markedResizedEnvironmentImage);

  const descriptionPrompt = `
You are an expert scene analyst. I will provide you with an image that has a red marker on it.
Your task is to provide a very dense, semantic description of what is at the exact location of the red marker.
Be specific about surfaces, objects, and spatial relationships. This description will be used to guide another AI in placing a new object.

Example semantic descriptions:
- "The product location is on the dark grey fabric of the sofa cushion, in the middle section, slightly to the left of the white throw pillow."
- "The product location is on the light-colored wooden floor, in the patch of sunlight coming from the window, about a foot away from the leg of the brown leather armchair."
- "The product location is on the white marble countertop, just to the right of the stainless steel sink and behind the green potted plant."

On top of the semantic description above, give a rough relative-to-image description.

Example relative-to-image descriptions:
- "The product location is about 10% away from the bottom-left of the image."
- "The product location is about 20% away from the right of the image."

Provide only the two descriptions concatenated in a few sentences.
`;
  
  let semanticLocationDescription = '';
  try {
    const debugDataUrl = await fileToDataUrl(markedResizedEnvironmentImage); // already computed as debugImageUrl above but safe
    const cacheKey = 'desc:' + hashString(debugDataUrl.slice(0, 500)) + ':' + dropPosition.xPercent.toFixed(2) + ':' + dropPosition.yPercent.toFixed(2);
    const cachedMem = descriptionCache.get(cacheKey);
    const cachedPersist = cachedMem || persistentDescriptionCache.get(cacheKey);
    if (cachedPersist) {
      semanticLocationDescription = cachedPersist;
      console.log('Using cached semantic description');
    } else {
      const descriptionResponse: any = await callModel('gemini-2.5-flash', [{ text: descriptionPrompt }, markedEnvironmentImagePart]);
      if ('text' in descriptionResponse && descriptionResponse.text) {
        semanticLocationDescription = descriptionResponse.text;
      } else {
        // Raw JSON path
        const parts = descriptionResponse?.candidates?.[0]?.content?.parts || [];
        semanticLocationDescription = parts.map((p: any) => p.text).filter(Boolean).join(' ').trim();
      }
      descriptionCache.set(cacheKey, semanticLocationDescription);
      persistentDescriptionCache.set(cacheKey, semanticLocationDescription);
      console.log('Generated description:', semanticLocationDescription);
    }
  } catch (error) {
    console.error('Failed to generate semantic location description:', error);
    // Fallback to a generic statement if the description generation fails
    semanticLocationDescription = `at the specified location.`;
  }

  // STEP 4: Generate composite image using the CLEAN image and the description
  console.log('Preparing to generate composite image...');
  
  const objectImagePart = await fileToPart(resizedObjectImage);
  const cleanEnvironmentImagePart = await fileToPart(resizedEnvironmentImage); // IMPORTANT: Use clean image
  
  const prompt = `
**Role:**
You are a visual composition expert. Your task is to take a 'product' image and seamlessly integrate it into a 'scene' image, adjusting for perspective, lighting, and scale.

**Specifications:**
-   **Product to add:**
    The first image provided. It may be surrounded by black padding or background, which you should ignore and treat as transparent and only keep the product.
-   **Scene to use:**
    The second image provided. It may also be surrounded by black padding, which you should ignore.
-   **Placement Instruction (Crucial):**
    -   You must place the product at the location described below exactly. You should only place the product once. Use this dense, semantic description to find the exact spot in the scene.
    -   **Product location Description:** "${semanticLocationDescription}"
-   **Final Image Requirements:**
    -   The output image's style, lighting, shadows, reflections, and camera perspective must exactly match the original scene.
    -   Do not just copy and paste the product. You must intelligently re-render it to fit the context. Adjust the product's perspective and orientation to its most natural position, scale it appropriately, and ensure it casts realistic shadows according to the scene's light sources.
    -   The product must have proportional realism. For example, a lamp product can't be bigger than a sofa in scene.
    -   You must not return the original scene image without product placement. The product must be always present in the composite image.

The output should ONLY be the final, composed image. Do not add any text or explanation.
`;

  const textPart = { text: prompt };
  
  console.log('Sending images and augmented prompt...');
  
  const response: any = await callModel('gemini-2.5-flash-image-preview', [objectImagePart, cleanEnvironmentImagePart, textPart]);

  console.log('Received response.');
  
  const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);

  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData;
    console.log(`Received image data (${mimeType}), length:`, data.length);
    const generatedSquareImageUrl = `data:${mimeType};base64,${data}`;
    
    console.log('Cropping generated image to original aspect ratio...');
    const finalImageUrl = await cropToOriginalAspectRatio(
        generatedSquareImageUrl,
        originalWidth,
        originalHeight,
        MAX_DIMENSION
    );
    
    return { finalImageUrl, debugImageUrl, finalPrompt: prompt };
  }

  console.error("Model response did not contain an image part.", response);
  throw new Error("The AI model did not return an image. Please try again.");
};