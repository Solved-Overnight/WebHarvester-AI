'use server';

/**
 * @fileOverview A flow that suggests key data points within the DOM content using AI.
 *
 * - suggestDataPoints - A function that handles the suggestion of data points.
 * - SuggestDataPointsInput - The input type for the suggestDataPoints function.
 * - SuggestDataPointsOutput - The return type for the suggestDataPoints function.
 */

import {z, genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const SuggestDataPointsInputSchema = z.object({
  domContent: z
    .string()
    .describe('The DOM content of the website to analyze.'),
  apiKey: z.string().optional().describe('The Google AI API key.'),
});
export type SuggestDataPointsInput = z.infer<typeof SuggestDataPointsInputSchema>;

const DataPointSchema = z.object({
  label: z.string().describe('A user-friendly label for the data point (e.g., "Product Name").'),
  selector: z.string().describe('The CSS selector to find the data point within the repeating element.'),
  attribute: z.optional(z.string()).describe("Optional attribute to extract (e.g., 'src', 'href'). If omitted, text content is used."),
});

const DataCollectionSchema = z.object({
    collectionName: z.string().describe("A name for the collection of items (e.g., 'Products', 'Articles')."),
    repeatingElementSelector: z.string().describe("The CSS selector for the main container element that repeats for each item in the list."),
    dataPoints: z.array(DataPointSchema).describe("The list of individual data points to extract from within each repeating element."),
});


const SuggestDataPointsOutputSchema = z.object({
  collections: z.array(DataCollectionSchema).describe('An array of suggested data collections found on the page.'),
});

export type SuggestDataPointsOutput = z.infer<typeof SuggestDataPointsOutputSchema>;

export async function suggestDataPoints(input: SuggestDataPointsInput): Promise<SuggestDataPointsOutput> {
  const {apiKey, domContent} = input;
  
  if (!apiKey) {
    throw new Error('The Google AI API key is missing. Please add it in the settings.');
  }

  try {
     const dynamicAi = genkit({
      plugins: [googleAI({apiKey})],
    });

    const { output } = await dynamicAi.generate({
      model: 'googleai/gemini-1.5-flash',
      output: {
        schema: SuggestDataPointsOutputSchema,
        format: "json",
      },
      prompt: `You are an expert web scraper. Your task is to analyze the provided HTML DOM content and identify collections of repeating items (like product listings, articles, search results) and the key data points within each item.

**Strict Rules:**
1.  **No Invention:** Do NOT invent selectors, labels, or attributes. Every suggestion must correspond directly to elements and attributes present in the provided HTML.
2.  **Accuracy is Key:** The CSS selectors you provide must be precise and valid.
3.  **Grounding:** Your response *must* be based exclusively on the provided HTML. Every selector you return must be verifiable in the content.

**Instructions:**

1.  **Identify Collections:** First, find any lists or grids of similar items. For each collection, you need to determine the main CSS selector for the repeating container element. For example, if you have a list of products, this would be the selector for the \`<div>\` or \`<li>\` that encloses a single product's information.
2.  **Name the Collection:** Give each collection a descriptive name (e.g., "Products", "Search Results", "Featured Articles").
3.  **Extract Data Points:** Within each repeating element, identify the individual pieces of data you can extract. For each piece of data:
    *   Provide a clear, user-friendly **label** (e.g., "Product Name", "Price", "Author").
    *   Provide a precise **CSS selector** that is relative to the repeating element. For instance, if the repeating element is \`.product-card\`, the selector for the name might be \`h2.title\`.
    *   If you need to extract an attribute (like an image URL from an \`<img>\` tag's \`src\` or a link from an \`<a>\` tag's \`href\`), specify the **attribute**. Otherwise, the text content will be extracted by default.

**Output Format:**
You must structure your response according to the JSON schema provided for the output. The output should be an object containing a "collections" array. Each object in the array represents one collection of items you've identified.

Now, analyze the following DOM content and provide your suggestions.

${domContent}`,
    });
    
    return output!;

  } catch (e: any) {
    console.error('An unexpected error occurred with the AI:', e);
    const message = e.message || 'An unexpected error occurred.';
    if (message.includes('API key not valid')) {
        throw new Error('The provided Google AI API key is not valid. Please check it in the settings.');
    }
    if (message.includes('quota')) {
        throw new Error('You have exceeded your Google AI API quota. Please check your plan and billing details.');
    }
    throw new Error(message);
  }
}