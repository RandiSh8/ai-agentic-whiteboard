import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { userInput, type, systemPrompt } = await req.json();

    if (!userInput || !type) {
      return NextResponse.json({ error: "Missing userInput or type" }, { status: 400 });
    }

    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const finalPrompt = `${systemPrompt}

User Request: ${userInput}

Return ONLY a valid JSON object. No markdown, no code fences, no explanation.

You are generating a clean, beautifully formatted diagram/flowchart.
Follow these strict structural and layout rules:
1. Every shape MUST have a unique "id" (e.g. "start", "step1", "dec1", "error1").
2. Layout vertical main flow at x = 250 with 190px vertical gap per row:
   - Row 1: x: 250, y: 50
   - Row 2: x: 250, y: 240
   - Row 3: x: 250, y: 430
   - Row 4: x: 250, y: 620
3. Side branches ('No' / 'Error' / alternate steps):
   - Place side branch shapes to the right at x: 550 at the same y-level as the decision node (e.g. y: 430 or y: 465 for diamonds).
   - NEVER place side branch nodes in the main x=250 vertical column!
4. Dimensions & Shape Labels:
   - rectangle / ellipse: width 180, height 70
   - diamond: width 140, height 140
   - CRITICAL: Do NOT put decision words like "Yes" or "No" inside the diamond shape label! The diamond label text should ONLY be the question (e.g. "Valid Password?"). The outcomes ("Yes" / "No") MUST be put on the arrow labels!
5. Color Palette:
   - Start/End: light blue #e0f2fe, stroke #1e293b
   - Process steps: light gray/blue #f1f5f9, stroke #1e293b
   - Decisions: light yellow #fef3c7, stroke #92400e
   - Success/Grant: light green #dcfce7, stroke #166534
   - Error/Failure: light pink #ffe4e6, stroke #991b1b
6. ARROWS:
   - Every arrow MUST specify "fromId" and "toId" matching existing shape ids.
   - For decision branches, specify "label": { "text": "Yes" } or { "text": "No" } on the arrow.

EXAMPLE JSON FORMAT:
{
  "elements": [
    {
      "id": "start",
      "type": "ellipse",
      "x": 250,
      "y": 50,
      "width": 180,
      "height": 70,
      "label": { "text": "Start User Login" },
      "strokeColor": "#1e293b",
      "backgroundColor": "#e0f2fe",
      "fillStyle": "solid",
      "strokeWidth": 2
    },
    {
      "id": "step1",
      "type": "rectangle",
      "x": 250,
      "y": 240,
      "width": 180,
      "height": 70,
      "label": { "text": "Submit Credentials" },
      "strokeColor": "#1e293b",
      "backgroundColor": "#f1f5f9",
      "fillStyle": "solid",
      "strokeWidth": 2
    },
    {
      "id": "dec1",
      "type": "diamond",
      "x": 270,
      "y": 430,
      "width": 140,
      "height": 140,
      "label": { "text": "Valid Password?" },
      "strokeColor": "#92400e",
      "backgroundColor": "#fef3c7",
      "fillStyle": "solid",
      "strokeWidth": 2
    },
    {
      "id": "success",
      "type": "rectangle",
      "x": 250,
      "y": 640,
      "width": 180,
      "height": 70,
      "label": { "text": "Grant Access" },
      "strokeColor": "#166534",
      "backgroundColor": "#dcfce7",
      "fillStyle": "solid",
      "strokeWidth": 2
    },
    {
      "id": "error",
      "type": "rectangle",
      "x": 550,
      "y": 465,
      "width": 180,
      "height": 70,
      "label": { "text": "Invalid Credentials Error" },
      "strokeColor": "#991b1b",
      "backgroundColor": "#ffe4e6",
      "fillStyle": "solid",
      "strokeWidth": 2
    },
    {
      "type": "arrow",
      "fromId": "start",
      "toId": "step1",
      "strokeColor": "#475569"
    },
    {
      "type": "arrow",
      "fromId": "step1",
      "toId": "dec1",
      "strokeColor": "#475569"
    },
    {
      "type": "arrow",
      "fromId": "dec1",
      "toId": "success",
      "label": { "text": "Yes" },
      "strokeColor": "#166534"
    },
    {
      "type": "arrow",
      "fromId": "dec1",
      "toId": "error",
      "label": { "text": "No" },
      "strokeColor": "#991b1b"
    }
  ]
}

Return the full JSON object:`;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: finalPrompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 4096,
          temperature: 0.4,
        },
      });
    } catch (primaryErr: any) {
      console.warn("Primary model gemini-3.8-flash error, trying gemini-3.6-flash:", primaryErr?.message);
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: finalPrompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 4096,
          temperature: 0.4,
        },
      });
    }

    let rawText = (response.text ?? "").trim();

    // Strip any accidental markdown fences
    rawText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 500 }
      );
    }

    let diagramResult: any;
    try {
      diagramResult = JSON.parse(rawText);
    } catch (parseError: any) {
      console.error("JSON parse failed. Length:", rawText.length, "Preview:", rawText.slice(0, 400));
      return NextResponse.json(
        { error: "AI response could not be parsed. Please try again." },
        { status: 500 }
      );
    }

    if (!Array.isArray(diagramResult?.elements)) {
      if (Array.isArray(diagramResult)) {
        diagramResult = { elements: diagramResult };
      } else {
        return NextResponse.json(
          { error: "AI response was missing the elements array." },
          { status: 500 }
        );
      }
    }

    // Log for debugging
    console.log("AI elements count:", diagramResult.elements.length);
    console.log("Arrows:", diagramResult.elements.filter((e: any) => e.type === "arrow").length);

    return NextResponse.json({ success: true, diagramResult });

  } catch (error: any) {
    console.error("AI route error:", error?.message ?? error);
    const errStr = String(error?.message ?? error);
    let userFriendlyError = "AI generation failed. Please try again.";

    if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
      userFriendlyError = "API rate limit reached (free tier limit of 20 requests/min). Please wait 10 seconds before generating again.";
    } else {
      try {
        const parsed = JSON.parse(errStr);
        if (parsed?.error?.message) {
          userFriendlyError = parsed.error.message;
        }
      } catch {
        if (typeof error?.message === "string") {
          userFriendlyError = error.message;
        }
      }
    }

    return NextResponse.json(
      { error: userFriendlyError },
      { status: 500 }
    );
  }
}