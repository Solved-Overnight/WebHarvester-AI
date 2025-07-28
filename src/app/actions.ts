'use server';

export async function fetchUrlContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        // Mimic a browser user agent to avoid simple bot blockers
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
         'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
         'Accept-Language': 'en-US,en;q=0.9',
         'Connection': 'keep-alive',
      },
      // Next.js fetch caching can be aggressive. We want fresh content.
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}. Status: ${response.status}`);
      return null;
    }

    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error fetching URL content:', error);
    return null;
  }
}
