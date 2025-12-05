// app/api/lighthouse/route.ts  (or pages/api/lighthouse.ts)
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

    // You can add more categories if you want (screenshot, trace, etc.)
    const categories = [
      'performance',
      'accessibility',
      'best-practices',
      'seo',
    ];

    const categoryParam = categories.map(c => `category=${c}`).join('&');

    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url
    )}&${categoryParam}&strategy=desktop&key=${API_KEY}`;

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

    // Helper to extract useful parts
    const extractAudit = (id: string) => lhr.audits[id];

    // Core metrics (the big numbers)
    const metrics = {
      FCP: extractAudit('first-contentful-paint')?.displayValue,
      LCP: extractAudit('largest-contentful-paint')?.displayValue,
      CLS: extractAudit('cumulative-layout-shift')?.displayValue,
      FID: extractAudit('max-potential-fid')?.displayValue || extractAudit('first-input-delay')?.displayValue,
      TBT: extractAudit('total-blocking-time')?.displayValue,
      TTI: extractAudit('interactive')?.displayValue,
      SI: extractAudit('speed-index')?.displayValue,
    };

    // Scores
    const scores = {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
    };

    // Opportunities / Diagnostics (the ones shown with savings)
    const opportunities = Object.values(lhr.audits)
      .filter((audit: any) =>
        audit.scoreDisplayMode === 'numeric' ||
        audit.scoreDisplayMode === 'binary'
      )
      .filter((audit: any) => audit.score < 1 && audit.displayValue)
      .map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue,
        numericValue: audit.numericValue,
        details: audit.details ? simplifyDetails(audit.details) : null,
      }))
      .sort((a: any, b: any) => (b.numericValue || 0) - (a.numericValue || 0))
      .slice(0, 20); // limit for sanity

    // Passed audits (green ones)
    const passed = Object.values(lhr.audits)
      .filter((audit: any) => audit.score === 1 && audit.scoreDisplayMode !== 'notApplicable')
      .map((audit: any) => ({
        id: audit.id,
        title: audit.title,
      }));

    // Screenshots & thumbnails
    const finalScreenshot = lhr.audits['final-screenshot']?.details?.data || null;
    const lcpElementScreenshot = extractAudit('largest-contentful-paint')?.details?.items?.[0]?.node?.snapshot || null;

    return NextResponse.json({
      success: true,
      url: lhr.finalUrl || url,
      fetchTime: lhr.fetchTime,
      lighthouseVersion: lhr.lighthouseVersion,
      scores,
      metrics,
      thumbnail: finalScreenshot,
      lcpScreenshot: lcpElementScreenshot,
      opportunities,
      passedAudits: passed,
      // You can even return the full raw result if you want (careful with size)
      // raw: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
};

// Helper to make huge details usable (tables, items, etc.)
function simplifyDetails(details: any) {
  if (!details || !details.items) return null;

  if (details.type === 'table') {
    return {
      headings: details.headings?.map((h: any) => h.label || h.key),
      items: details.items.slice(0, 15).map((item: any) =>
        details.headings.reduce((acc: any, h: any) => {
          acc[h.key || h.label] = item[h.key] || item[h.label];
          return acc;
        }, {})
      ),
    };
  }

  if (details.type === 'opportunity') {
    return details.overallSavingsMs
      ? `Potential savings: ${details.overallSavingsMs} ms`
      : null;
  }

  if (details.type === 'screenshot') {
    return details.data;
  }

  return details.items?.length > 0
    ? details.items.slice(0, 10).map((i: any) => i.url || i.node?.snippet || String(i))
    : null;
}