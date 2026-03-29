import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const {
      menteeEmail,
      menteeName,
      mentorName,
      mentorEmail,
      mentorLinkedin,
      opportunityTitle,
    } = await request.json()

    console.log('[notify-accepted] Sending email to:', menteeEmail)
    console.log('[notify-accepted] Opportunity:', opportunityTitle)
    console.log('[notify-accepted] Mentor:', mentorName)

    if (!menteeEmail) {
      console.error('[notify-accepted] Missing menteeEmail')
      return NextResponse.json(
        { success: false, error: 'Missing menteeEmail' },
        { status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'DANA Connect <onboarding@resend.dev>',
      to: menteeEmail,
      subject: 'Your application was accepted — DANA Connect',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1B2A72; font-size: 24px; margin: 0;">DANA Connect</h1>
          </div>

          <h2 style="color: #1B2A72; font-size: 20px;">Congratulations, ${menteeName}! 🎉</h2>

          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Great news! Your application to <strong>"${opportunityTitle}"</strong> has been accepted by <strong>${mentorName}</strong>.
          </p>

          <div style="background-color: #EEEDF8; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #1B2A72; font-size: 16px; margin: 0 0 12px 0;">Contact Your Mentor</h3>
            <p style="color: #333; font-size: 14px; margin: 0 0 8px 0;">
              <strong>Email:</strong> <a href="mailto:${mentorEmail}" style="color: #4F63D2;">${mentorEmail}</a>
            </p>
            ${mentorLinkedin ? `
            <p style="color: #333; font-size: 14px; margin: 0;">
              <strong>LinkedIn:</strong> <a href="${mentorLinkedin}" style="color: #4F63D2;">${mentorLinkedin}</a>
            </p>
            ` : ''}
          </div>

          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            We encourage you to reach out to your mentor as soon as possible to discuss next steps.
          </p>

          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Best of luck with your research journey!
          </p>

          <hr style="border: none; border-top: 1px solid #E2E4F0; margin: 24px 0;" />

          <p style="color: #5A6480; font-size: 14px; text-align: center;">
            — The DANA Connect Team
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('[notify-accepted] Resend error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('[notify-accepted] Email sent successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[notify-accepted] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
