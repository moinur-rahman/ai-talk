import axios from 'axios';

export async function fetchBase64FromPresignedUrl(url: string): Promise<string> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data as ArrayBuffer).toString('base64');
}
