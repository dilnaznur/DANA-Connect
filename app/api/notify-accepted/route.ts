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

    await resend.emails.send({
      from: 'DANA Connect <onboarding@resend.dev>',
      to: menteeEmail,
      subject: `Your application to "${opportunityTitle}" was accepted!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1B2A72;">Congratulations, ${menteeName}!</h2>
          <p>Your application to <strong>${opportunityTitle}</strong> has been accepted by <strong>${mentorName}</strong>.</p>
          <p>You can now reach out to your mentor directly:</p>
          <ul>
            <li>Email: <a href="mailto:${mentorEmail}">${mentorEmail}</a></li>
            ${mentorLinkedin ? `<li>LinkedIn: <a href="${mentorLinkedin}">${mentorLinkedin}</a></li>` : ''}
          </ul>
          <p>Best of luck with your research journey!</p>
          <p style="color: #5A6480; font-size: 14px;">- The DANA Connect Team</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}