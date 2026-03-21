import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import dotenv from 'dotenv'
dotenv.config();
const resend = new Resend(process.env.RESEND_KEY);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());

    const { data, error } = await resend.emails.send({
      from: 'noreply@hemanthr.xyz',
      to: 'rachapalli.hemanth5544@gmail.com',
      subject: 'Voice Note',
      text: 'Here is your voice note.',
      attachments: [
        {
          filename: 'voice-note.webm', 
          content: buffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}