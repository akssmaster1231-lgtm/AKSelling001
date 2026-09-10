import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || !/^\+?\d{10,15}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Valid phone number required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete old codes for this phone, then insert new
    await supabase.from("otp_codes").delete().eq("phone", phone);
    const { error: insertError } = await supabase.from("otp_codes").insert({
      phone,
      code,
      expires_at: expiresAt,
    });

    if (insertError) throw insertError;

    // Try to send SMS via Twilio
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER") || Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

    if (twilioSid && twilioToken && twilioFrom) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const body = new URLSearchParams();
      body.append("To", phone);
      body.append("From", twilioFrom);
      body.append("MessagingServiceSid", Deno.env.get("TWILIO_MESSAGING_SERVICE_SID") || "");
      body.append("Body", `Your AKSelling OTP is ${code}. Valid for 5 minutes. Do not share it with anyone.`);

      const twilioResp = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      if (!twilioResp.ok) {
        const twilioErr = await twilioResp.text();
        console.error("Twilio error:", twilioErr);
        return new Response(
          JSON.stringify({ error: "Failed to send SMS. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.warn("Twilio credentials not configured. OTP stored but not sent via SMS.");
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to send OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
