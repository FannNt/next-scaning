import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert to base64
    const base64Image = buffer.toString('base64');
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:image/jpeg;base64,${base64Image}`,
        {
          folder: 'recycling-scanner',
        },
        (error, result) => {
          if (error) reject(error);
          resolve(result);
        }
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageUrl = (uploadResponse as any).secure_url;

    // Use Groq with the Cloudinary URL
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    // First analyze for authenticity
    const authenticityCheck = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "ONLY analyze if this image appears to be authentic or AI-generated. Respond in this format:\nAuthenticity: [Real Photo/AI-Generated/Edited]\nConfidence: [percentage]\nReason: [brief explanation of key indicators]"
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      model: "llama-3.2-90b-vision-preview",
      temperature: 0.3,
      max_tokens: 150
    });

    const authenticityResult = authenticityCheck.choices[0]?.message?.content || '';

    // Then proceed with the regular recycling analysis
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
                url: imageUrl
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

    // get recycling suggestions
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
      authenticity: authenticityResult,
      items: itemsList,
      result: suggestions.choices[0]?.message?.content,
      imageUrl
    });

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error processing image',
      details: error
    }, { status: 500 });
  }
} 