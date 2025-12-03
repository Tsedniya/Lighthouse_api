import { NextRequest, NextResponse } from 'next/server';

export const POST = async (request: NextRequest) => {
  try {
    const { url } = await request.json();

    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return NextResponse.json(
        { error: 'Please enter a valid URL starting with http:// or https://' },
        { status: 400 }
      );
    }

    const API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

 const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
  url
)}&key=${API_KEY}&strategy=desktop`;

    const res = await fetch(endpoint, { next: { revalidate: 3600 } });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('PageSpeed API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to run Lighthouse', details: errorText },
        { status: 500 }
      );
    }

    const data = await res.json();
    const lhr = data.lighthouseResult;

    const scores = {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
    };

    return NextResponse.json({
      success: true,
      url: lhr.finalUrl || url,
      scores,
      lighthouseVersion: lhr.lighthouseVersion,
      fetchTime: lhr.fetchTime,
      thumbnail: lhr.audits['final-screenshot']?.details?.data || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
};
