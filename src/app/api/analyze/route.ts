import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Use Groq with Llava model
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    // First analyze the image
    const imageAnalysis = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are an expert at analyzing images and identifying recyclable items. Please examine this image and list all recyclable items you can see in detail."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      model: "llama-3.2-90b-vision-preview",
      temperature: 0.7,
      max_tokens: 1000
    });

    const itemsList = imageAnalysis.choices[0]?.message?.content || '';

    // Then get recycling suggestions
    const suggestions = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a recycling expert. Given a list of items, suggest creative ways to recycle or combine them into new useful items. Also estimate their potential value."
        },
        {
          role: "user",
          content: `These items were found in an image: ${itemsList}. What can be made from these items and what's their potential value?`
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 1000
    });

    return NextResponse.json({ 
      items: itemsList,
      result: suggestions.choices[0]?.message?.content
    });

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error processing image',
      details: error
    }, { status: 500 });
  }
} 