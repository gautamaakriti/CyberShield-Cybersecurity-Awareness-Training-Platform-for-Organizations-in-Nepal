import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.phishing import PhishingCampaign, PhishingAssignment
from app.models.employee import Employee

router = APIRouter(prefix="/phishing", tags=["phishing"])

# ─── Schemas ──────────────────────────────────────────────────────────────────

class GenerateContentRequest(BaseModel):
    email_type: str
    template_type: str
    difficulty: str

class GenerateContentResponse(BaseModel):
    sender_name: str
    sender_email_display: str
    subject: str
    message_body: str
    cta_text: str

class CreateCampaignRequest(BaseModel):
    title: str
    email_type: str
    template_type: str
    difficulty: str
    sender_name: str
    sender_email_display: str
    subject: str
    message_body: str
    cta_text: Optional[str] = None
    employee_ids: List[int]

# ─── Template Engine ──────────────────────────────────────────────────────────

TEMPLATES = {
    "phishing": {
        "password_reset": {
            "easy": [
                {
                    "sender_name": "IT Suport Team",
                    "sender_email_display": "it-suport@company-secure.xyz",
                    "subject": "URGENT!! Your password expire TODAY!!!",
                    "message_body": "Dear Valued Employee,\n\nYour password is EXPIRE today and your account will be BLOCK if you don not act NOW!!!\n\nClick the link below IMMEDIATELY to reset your password or you will lose access to all company systems forever.\n\nThis is very URGENT matter. Do not ignore this email or you will face serious consequences.\n\nAct NOW before it is too late!!!",
                    "cta_text": "Reset Password NOW!!!"
                },
                {
                    "sender_name": "Security Departement",
                    "sender_email_display": "noreply@secure-login-verify.com",
                    "subject": "Your account has been HACKED - Act Immediately",
                    "message_body": "ATTENTION!!!\n\nWe have detected suspicious login to your account from unknown location (Russia, 2:34 AM). Your account may be compromise.\n\nYou must verify your identity IMMEDIATELY by clicking button below. If you do not verify within 1 hour your account will be permanently deleted.\n\nDo not share this email with anyone. This is confidential security alert.",
                    "cta_text": "Verify My Account"
                }
            ],
            "medium": [
                {
                    "sender_name": "IT Security Team",
                    "sender_email_display": "security@cybershield-corp.net",
                    "subject": "Action Required: Password Reset Notification",
                    "message_body": "Dear Employee,\n\nOur security systems have detected that your account password is due for a mandatory reset as per our 90-day rotation policy.\n\nPlease reset your password within the next 24 hours to avoid any disruption to your access. Use the button below to securely update your credentials.\n\nIf you believe you received this in error, please contact IT support at extension 4521.\n\nBest regards,\nIT Security Team\nCyberShield Corporation",
                    "cta_text": "Reset My Password"
                },
                {
                    "sender_name": "System Administrator",
                    "sender_email_display": "admin@internal-helpdesk.org",
                    "subject": "Password Expiry Notice - Please Update",
                    "message_body": "Hello,\n\nThis is an automated notification to inform you that your network password will expire in 48 hours.\n\nTo ensure uninterrupted access to company resources including email, VPN, and internal systems, please update your password using the secure link below.\n\nFor security purposes, do not share your new password with anyone, including IT staff.\n\nThank you,\nSystem Administration",
                    "cta_text": "Update Password"
                }
            ],
            "hard": [
                {
                    "sender_name": "Akriti Gautam - IT Security",
                    "sender_email_display": "security@cybershield.com.np",
                    "subject": "Scheduled Password Update - Q1 Security Compliance",
                    "message_body": "Hi,\n\nAs part of our Q1 2025 security compliance initiative, all employee passwords are being rotated across the organization. This is a standard procedure aligned with our ISO 27001 certification requirements.\n\nYour password reset window is scheduled for today. Please complete the update at your earliest convenience to remain compliant. The process takes less than 2 minutes.\n\nIf you have any concerns, feel free to reach out to the IT Security team directly.\n\nBest,\nAkriti Gautam\nIT Security Lead | CyberShield Nepal",
                    "cta_text": "Complete Password Reset"
                }
            ]
        },
        "hr_notice": {
            "easy": [
                {
                    "sender_name": "HR Departement",
                    "sender_email_display": "hr@company-benefits-portal.xyz",
                    "subject": "YOU HAVE UNCLAIMED SALARY BONUS - Claim NOW",
                    "message_body": "Dear Employee,\n\nCongratulation!!! You have been selected for SPECIAL BONUS payment of Rs. 50,000 which is unclaim in our system!!!\n\nThis bonus will EXPIRE if you do not claim within 24 hours. You must verify your bank details and employee ID to receive payment.\n\nClick below immediately to claim your bonus. Do not tell other employees as this is confidential offer only for you.",
                    "cta_text": "Claim My Bonus Now"
                }
            ],
            "medium": [
                {
                    "sender_name": "Human Resources",
                    "sender_email_display": "hr-notifications@staffportal-np.com",
                    "subject": "Important: Updated Leave Policy - Action Required",
                    "message_body": "Dear Team Member,\n\nPlease be informed that our company leave policy has been updated effective this month. All employees are required to review and acknowledge the new policy through our HR portal.\n\nKey changes include revised sick leave entitlements and the introduction of work-from-home guidelines. Failure to acknowledge by Friday may affect your leave balance calculations.\n\nPlease log in to the HR portal using the link below to review and sign the updated policy document.\n\nRegards,\nHuman Resources Department",
                    "cta_text": "Review & Acknowledge Policy"
                }
            ],
            "hard": [
                {
                    "sender_name": "Priya Sharma - HR Manager",
                    "sender_email_display": "priya.sharma@cybershield.com.np",
                    "subject": "Confidential: Annual Performance Review Documents",
                    "message_body": "Hi,\n\nI hope you're doing well. I'm reaching out regarding your upcoming annual performance review scheduled for next week.\n\nPlease find your self-assessment form and last year's KPI summary in the secure HR portal. You'll need to complete the self-assessment section before your review meeting.\n\nThis is time-sensitive as your manager needs to review your submission at least 48 hours before the meeting. Please complete it by Thursday EOD.\n\nFeel free to reach me if you have any questions.\n\nWarm regards,\nPriya Sharma\nHR Manager | CyberShield Nepal",
                    "cta_text": "Access Performance Documents"
                }
            ]
        },
        "finance": {
            "easy": [
                {
                    "sender_name": "Finance Dept",
                    "sender_email_display": "invoice@payment-processing-urgent.com",
                    "subject": "OVERDUE INVOICE - PAY IMMEDIATELY OR FACE LEGAL ACTION",
                    "message_body": "URGENT NOTICE!!!\n\nYour company have OVERDUE invoice of Rs. 2,50,000 which must be pay IMMEDIATELY.\n\nIf payment is not made within 24 HOURS we will take LEGAL ACTION and report to government authorities. Your company operations may be SUSPENDED.\n\nClick below to make immediate payment. Accept all credit cards and bank transfer.\n\nDo not ignore this final warning!!!",
                    "cta_text": "Pay Invoice Immediately"
                }
            ],
            "medium": [
                {
                    "sender_name": "Accounts Payable",
                    "sender_email_display": "accounts@finance-portal-internal.net",
                    "subject": "Invoice #INV-2025-0847 Requires Your Approval",
                    "message_body": "Dear Team,\n\nPlease find attached invoice #INV-2025-0847 for Rs. 1,85,000 from Vertex Solutions Pvt. Ltd. for IT infrastructure services rendered in December 2024.\n\nThis invoice requires department head approval before processing. Please review the invoice details and provide your authorization through the finance portal by end of business today.\n\nIf you have any questions regarding this invoice, please contact the accounts team.\n\nThank you,\nAccounts Payable Team",
                    "cta_text": "Review & Approve Invoice"
                }
            ],
            "hard": [
                {
                    "sender_name": "Rajesh Karmacharya - CFO",
                    "sender_email_display": "rajesh.k@cybershield.com.np",
                    "subject": "Urgent: Wire Transfer Authorization Needed",
                    "message_body": "Hi,\n\nI'm currently in a board meeting and unable to take calls. We need to process an urgent vendor payment today to avoid contract penalties.\n\nPlease authorize the transfer of Rs. 4,50,000 to our software vendor TechNova Systems. Their banking details are updated in the finance portal — please use the new account number as the old one is being closed.\n\nI need this done before 3 PM today. Please confirm via email once processed.\n\nThanks,\nRajesh Karmacharya\nCFO | CyberShield Nepal",
                    "cta_text": "Authorize Transfer"
                }
            ]
        },
        "it_alert": {
            "easy": [
                {
                    "sender_name": "IT Helpdesk",
                    "sender_email_display": "helpdesk@system-alert-critical.xyz",
                    "subject": "VIRUS DETECTED on Your Computer!!! ACT NOW!!!",
                    "message_body": "CRITICAL SECURITY ALERT!!!\n\nOur system has detect DANGEROUS VIRUS on your computer!!!! Your personal data and company files are at RISK of being stolen RIGHT NOW!!!\n\nYou must click the button below IMMEDIATELY to run emergency virus scan and remove the threat. If you wait your computer will be permanently damage and all data will be lost!!!\n\nDo not turn off computer. Do not call IT department. Follow instructions ONLY from this email.",
                    "cta_text": "Remove Virus Now!!!"
                }
            ],
            "medium": [
                {
                    "sender_name": "IT Support Desk",
                    "sender_email_display": "itsupport@internal-ticket-system.org",
                    "subject": "Mandatory Security Patch Installation Required",
                    "message_body": "Dear User,\n\nOur IT team has identified a critical security vulnerability affecting Windows systems across the organization. Microsoft has released an emergency patch (KB5034441) that must be installed immediately.\n\nPlease click the link below to initiate the patch installation during your next available 15-minute break. The patch requires a system restart so please save your work beforehand.\n\nThis patch must be installed by all employees before Friday to maintain network security compliance.\n\nIT Support Team",
                    "cta_text": "Install Security Patch"
                }
            ],
            "hard": [
                {
                    "sender_name": "Bikram Thapa - IT Infrastructure",
                    "sender_email_display": "bikram.thapa@cybershield.com.np",
                    "subject": "VPN Certificate Renewal - Action Required by Friday",
                    "message_body": "Hi,\n\nJust a heads up — our VPN SSL certificates are being renewed this Friday as part of our annual infrastructure maintenance. All remote employees will need to re-authenticate after the renewal is complete.\n\nTo ensure seamless access, please update your VPN client credentials through the secure portal before Friday 5 PM. The process takes about 3 minutes and you'll receive a new certificate file to install.\n\nIf you primarily work from the office, no action is required on your part.\n\nLet me know if you run into any issues.\n\nBikram Thapa\nIT Infrastructure Lead",
                    "cta_text": "Update VPN Credentials"
                }
            ]
        }
    },
    "genuine": {
        "password_reset": {
            "easy": [
                {
                    "sender_name": "IT Security Team",
                    "sender_email_display": "security@cybershield.com.np",
                    "subject": "Reminder: Quarterly Password Update",
                    "message_body": "Hi Team,\n\nThis is a friendly reminder that our quarterly password update cycle begins next week. As part of our standard security practice, all employees are encouraged to update their passwords.\n\nThis is not mandatory at this time but is highly recommended. If you'd like to update your password, you can do so through the standard IT portal.\n\nPlease reach out to the IT helpdesk at extension 100 if you need assistance.\n\nThank you,\nIT Security Team",
                    "cta_text": "Update Password (Optional)"
                }
            ],
            "medium": [
                {
                    "sender_name": "IT Security Team",
                    "sender_email_display": "security@cybershield.com.np",
                    "subject": "Scheduled Maintenance: Password Policy Update This Weekend",
                    "message_body": "Dear All,\n\nPlease be informed that we will be upgrading our password management system this Saturday from 10 PM to 2 AM.\n\nDuring this window, password reset functionality will be temporarily unavailable. We recommend updating your password before Saturday if it is due for renewal.\n\nAll other systems including email and internal tools will remain fully operational during the maintenance window.\n\nApologies for any inconvenience. Please contact IT at extension 100 for urgent support.\n\nRegards,\nIT Security Team",
                    "cta_text": "View Maintenance Schedule"
                }
            ],
            "hard": [
                {
                    "sender_name": "IT Security Team",
                    "sender_email_display": "security@cybershield.com.np",
                    "subject": "New Password Policy Effective March 2025",
                    "message_body": "Hi Everyone,\n\nFollowing our recent security audit, we are updating our password policy effective 1st March 2025.\n\nKey changes:\n• Minimum password length increases from 8 to 12 characters\n• Passwords must include at least one special character\n• Password reuse limited to last 10 passwords\n\nYou will be prompted to update your password on your next login after March 1st. No action is required before then.\n\nFull policy documentation is available on the company intranet. Please reach out to IT if you have questions.\n\nBest,\nIT Security Team",
                    "cta_text": "Read Full Policy"
                }
            ]
        },
        "hr_notice": {
            "easy": [
                {
                    "sender_name": "Human Resources",
                    "sender_email_display": "hr@cybershield.com.np",
                    "subject": "Office Closure Notice - Dashain Holiday",
                    "message_body": "Dear All,\n\nPlease note that the office will be closed from October 12-17 for the Dashain festival.\n\nAll employees should ensure pending tasks are completed or handed over before the holiday begins. Emergency contacts will be shared separately for critical matters.\n\nWishing everyone a happy and safe Dashain!\n\nWarm regards,\nHuman Resources",
                    "cta_text": "View Holiday Calendar"
                }
            ],
            "medium": [
                {
                    "sender_name": "Human Resources",
                    "sender_email_display": "hr@cybershield.com.np",
                    "subject": "Annual Leave Balance Update - Please Review",
                    "message_body": "Dear Team,\n\nAs we approach the end of Q1, we'd like to remind all employees to review their annual leave balances.\n\nLeave balances can be viewed through the HR portal. Please note that unused leave from the previous year must be utilized by June 30th as per company policy — leave cannot be carried forward beyond this date.\n\nIf you have any discrepancies in your leave balance, please contact HR by March 31st.\n\nBest regards,\nHuman Resources Department",
                    "cta_text": "Check Leave Balance"
                }
            ],
            "hard": [
                {
                    "sender_name": "Priya Sharma - HR Manager",
                    "sender_email_display": "priya.sharma@cybershield.com.np",
                    "subject": "Training Session: Workplace Safety & Compliance - Feb 28",
                    "message_body": "Hi Everyone,\n\nWe're conducting our annual Workplace Safety & Compliance training session on February 28th from 2-4 PM in Conference Room B.\n\nAttendance is mandatory for all permanent employees as this forms part of our annual compliance requirements. The session will cover updated fire safety procedures, data handling guidelines, and harassment prevention policies.\n\nPlease register through the link below to confirm your attendance. Virtual participation is available for branch office employees.\n\nLunch will be provided for in-person attendees.\n\nThanks,\nPriya Sharma\nHR Manager",
                    "cta_text": "Register for Training"
                }
            ]
        },
        "finance": {
            "easy": [
                {
                    "sender_name": "Finance Team",
                    "sender_email_display": "finance@cybershield.com.np",
                    "subject": "Expense Reimbursement - January Cycle Processed",
                    "message_body": "Dear Team,\n\nPlease be informed that the January expense reimbursements have been processed and payments will reflect in your accounts within 3-5 business days.\n\nIf you have not submitted your January expenses yet, the portal will remain open until this Friday, February 7th.\n\nFor any queries regarding your reimbursement amount, please contact the finance team.\n\nRegards,\nFinance Team",
                    "cta_text": "View Reimbursement Status"
                }
            ],
            "medium": [
                {
                    "sender_name": "Accounts Team",
                    "sender_email_display": "accounts@cybershield.com.np",
                    "subject": "Budget Submission Deadline - Department Heads",
                    "message_body": "Dear Department Heads,\n\nThis is a reminder that Q2 budget submissions are due by February 28th.\n\nPlease submit your department's projected expenses, headcount requirements, and capital expenditure requests through the finance portal. Templates from last year are pre-loaded for your convenience.\n\nThe Finance Committee will review all submissions in the first week of March. Departments that miss the deadline may face delayed budget approvals.\n\nPlease reach out if you need any assistance with the submission process.\n\nRegards,\nAccounts Team",
                    "cta_text": "Submit Budget"
                }
            ],
            "hard": [
                {
                    "sender_name": "Rajesh Karmacharya - CFO",
                    "sender_email_display": "rajesh.k@cybershield.com.np",
                    "subject": "FY2024-25 Financial Results - Internal Preview",
                    "message_body": "Hi Team Leads,\n\nI wanted to share a preview of our FY2024-25 financial results ahead of the all-hands meeting next Thursday.\n\nI'm pleased to report that we've exceeded our revenue targets by 12% and kept operating costs within budget. Full details will be presented at the meeting, but wanted to give you a heads up so you can prepare any departmental questions.\n\nThe detailed report is available in the executive portal. Please treat this as confidential until the official announcement.\n\nSee you Thursday.\n\nRajesh\nCFO | CyberShield Nepal",
                    "cta_text": "View Financial Report"
                }
            ]
        },
        "it_alert": {
            "easy": [
                {
                    "sender_name": "IT Helpdesk",
                    "sender_email_display": "helpdesk@cybershield.com.np",
                    "subject": "Scheduled System Maintenance - Saturday Night",
                    "message_body": "Hi Everyone,\n\nWe will be performing routine server maintenance this Saturday from 11 PM to 3 AM.\n\nDuring this time, email and internal systems may be temporarily unavailable. Please plan accordingly and save any important work before 10:30 PM Saturday.\n\nWe apologize for the inconvenience and appreciate your patience.\n\nIT Helpdesk",
                    "cta_text": "View Maintenance Details"
                }
            ],
            "medium": [
                {
                    "sender_name": "IT Support",
                    "sender_email_display": "itsupport@cybershield.com.np",
                    "subject": "New Software Rollout: Microsoft 365 Update",
                    "message_body": "Dear All,\n\nWe will be rolling out the latest Microsoft 365 update to all workstations starting next Monday.\n\nThe update will be pushed automatically during non-business hours and should not disrupt your work. However, you may notice some interface changes in Teams and Outlook.\n\nUser guides for the new features are available on the intranet. A brief walkthrough session will be held Wednesday at 3 PM for anyone who'd like a demonstration.\n\nContact the helpdesk at extension 100 for any issues post-update.\n\nIT Support Team",
                    "cta_text": "View Update Guide"
                }
            ],
            "hard": [
                {
                    "sender_name": "Bikram Thapa - IT Infrastructure",
                    "sender_email_display": "bikram.thapa@cybershield.com.np",
                    "subject": "Network Upgrade Complete - Action Needed for WiFi Reconnection",
                    "message_body": "Hi All,\n\nOur network infrastructure upgrade was completed successfully last night. The upgrade delivers significantly improved speeds and better coverage across all floors.\n\nAs a result of the upgrade, the office WiFi network name has changed from 'CyberShield-Office' to 'CS-Corporate-5G'. You'll need to reconnect your devices using your standard company credentials.\n\nLaptops managed by IT will be updated automatically. Personal devices and mobile phones will need to be reconnected manually.\n\nPlease log a helpdesk ticket if you experience any connectivity issues.\n\nBikram Thapa\nIT Infrastructure Lead",
                    "cta_text": "Reconnection Guide"
                }
            ]
        }
    }
}

@router.post("/generate-content", response_model=GenerateContentResponse)
def generate_content(req: GenerateContentRequest):
    try:
        pool = TEMPLATES.get(req.email_type, {}).get(req.template_type, {}).get(req.difficulty, [])
        if not pool:
            pool = TEMPLATES.get(req.email_type, {}).get(req.template_type, {}).get("medium", [])
        if not pool:
            raise HTTPException(status_code=400, detail="No template found for these settings.")
        template = random.choice(pool)
        return GenerateContentResponse(**template)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

# ─── Admin Routes ─────────────────────────────────────────────────────────────

@router.post("/create")
def create_campaign(req: CreateCampaignRequest, db: Session = Depends(get_db)):
    campaign = PhishingCampaign(
        title=req.title,
        email_type=req.email_type,
        template_type=req.template_type,
        difficulty=req.difficulty,
        sender_name=req.sender_name,
        sender_email_display=req.sender_email_display,
        subject=req.subject,
        message_body=req.message_body,
        cta_text=req.cta_text,
    )
    db.add(campaign)
    db.flush()
    for emp_id in req.employee_ids:
        db.add(PhishingAssignment(
            campaign_id=campaign.id,
            employee_id=emp_id,
            result_status="pending",
        ))
    db.commit()
    db.refresh(campaign)
    return {"message": "Campaign created", "campaign_id": campaign.id}

@router.delete("/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(PhishingCampaign).filter(PhishingCampaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.query(PhishingAssignment).filter(PhishingAssignment.campaign_id == campaign_id).delete()
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted"}

@router.get("/campaigns")
def list_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(PhishingCampaign).order_by(PhishingCampaign.created_at.desc()).all()
    result = []
    for c in campaigns:
        assignments = db.query(PhishingAssignment).filter(PhishingAssignment.campaign_id == c.id).all()
        total = len(assignments)
        opened = sum(1 for a in assignments if a.is_opened)
        clicked = sum(1 for a in assignments if a.is_clicked)
        reported = sum(1 for a in assignments if a.is_reported_phishing or a.is_reported_spam)
        emp_ids = [a.employee_id for a in assignments]
        employees = db.query(Employee).filter(Employee.id.in_(emp_ids)).all() if emp_ids else []
        result.append({
            "id": c.id,
            "title": c.title,
            "email_type": c.email_type,
            "template_type": c.template_type,
            "difficulty": c.difficulty,
            "subject": c.subject,
            "sender_name": c.sender_name,
            "sender_email_display": c.sender_email_display,
            "message_body": c.message_body,
            "cta_text": c.cta_text,
            "created_at": c.created_at,
            "total_assigned": total,
            "total_opened": opened,
            "total_clicked": clicked,
            "total_reported": reported,
            "open_rate": round(opened / total * 100) if total > 0 else 0,
            "click_rate": round(clicked / total * 100) if total > 0 else 0,
            "report_rate": round(reported / total * 100) if total > 0 else 0,
            "employees": [{"id": e.id, "full_name": e.full_name, "email": e.email} for e in employees],
        })
    return result

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    total_assigned = db.query(PhishingAssignment).count()
    total_opened = db.query(PhishingAssignment).filter(PhishingAssignment.is_opened == True).count()
    total_clicked = db.query(PhishingAssignment).filter(PhishingAssignment.is_clicked == True).count()
    total_reported_phishing = db.query(PhishingAssignment).filter(PhishingAssignment.is_reported_phishing == True).count()
    total_reported_spam = db.query(PhishingAssignment).filter(PhishingAssignment.is_reported_spam == True).count()

    # 🔧 FIX: "ignored" means the employee never reported it as phishing or spam.
    # This includes: never opened it (pending), opened but did nothing, or even
    # clicked the link but still never reported it.
    total_ignored = db.query(PhishingAssignment).filter(
        PhishingAssignment.is_reported_phishing == False,
        PhishingAssignment.is_reported_spam == False,
    ).count()

    total_campaigns = db.query(PhishingCampaign).count()

    rows = (
        db.query(PhishingAssignment, PhishingCampaign, Employee)
        .join(PhishingCampaign, PhishingAssignment.campaign_id == PhishingCampaign.id)
        .join(Employee, PhishingAssignment.employee_id == Employee.id)
        .order_by(PhishingAssignment.created_at.desc())
        .all()
    )

    emp_map: dict = {}
    for assignment, campaign, employee in rows:
        key = employee.id
        if key not in emp_map:
            emp_map[key] = {"name": employee.full_name, "email": employee.email, "total": 0, "clicked": 0, "reported": 0}
        emp_map[key]["total"] += 1
        if assignment.is_clicked:
            emp_map[key]["clicked"] += 1
        if assignment.is_reported_phishing or assignment.is_reported_spam:
            emp_map[key]["reported"] += 1

    employee_scores = []
    for e in emp_map.values():
        t = e["total"]
        score = round(((e["reported"] * 1.0 + (t - e["clicked"] - e["reported"]) * 0.5) / t) * 100) if t > 0 else 0
        risk = "high" if e["clicked"] > 0 and e["reported"] == 0 else "medium" if e["clicked"] > 0 else "low"
        employee_scores.append({**e, "score": score, "risk": risk})

    table = []
    for assignment, campaign, employee in rows:
        # 🔧 FIX 2: Show "ignored" in the table for anyone who never reported
        # phishing or spam — even if they opened or clicked the email.
        not_reported = not assignment.is_reported_phishing and not assignment.is_reported_spam
        display_status = "ignored" if not_reported else assignment.result_status

        table.append({
            "assignment_id": assignment.id,
            "employee_name": employee.full_name,
            "employee_email": employee.email,
            "campaign_id": campaign.id,
            "campaign_title": campaign.title,
            "email_subject": campaign.subject,
            "email_type": campaign.email_type,
            "difficulty": campaign.difficulty,
            "is_opened": assignment.is_opened,
            "is_clicked": assignment.is_clicked,
            "is_reported_phishing": assignment.is_reported_phishing,
            "is_reported_spam": assignment.is_reported_spam,
            "result_status": display_status,  # 🔧 FIX 2: use display_status
            "created_at": assignment.created_at,
        })

    return {
        "stats": {
            "total_campaigns": total_campaigns,
            "total_assigned": total_assigned,
            "total_opened": total_opened,
            "total_clicked": total_clicked,
            "total_reported_phishing": total_reported_phishing,
            "total_reported_spam": total_reported_spam,
            "total_ignored": total_ignored,
        },
        "table": table,
        "employee_scores": employee_scores,
    }

# ─── Employee Routes ──────────────────────────────────────────────────────────

def get_assignment_or_404(assignment_id: int, employee_id: int, db: Session):
    assignment = (
        db.query(PhishingAssignment)
        .filter(PhishingAssignment.id == assignment_id, PhishingAssignment.employee_id == employee_id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@router.get("/inbox")
def get_inbox(employee_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(PhishingAssignment, PhishingCampaign)
        .join(PhishingCampaign, PhishingAssignment.campaign_id == PhishingCampaign.id)
        .filter(PhishingAssignment.employee_id == employee_id)
        .order_by(PhishingAssignment.created_at.desc())
        .all()
    )
    return [{
        "assignment_id": assignment.id,
        "sender_name": campaign.sender_name,
        "sender_email_display": campaign.sender_email_display,
        "subject": campaign.subject,
        "preview": campaign.message_body[:80] + "...",
        "is_opened": assignment.is_opened,
        "result_status": assignment.result_status,
        "created_at": assignment.created_at,
    } for assignment, campaign in rows]

@router.get("/inbox/{assignment_id}")
def get_email_detail(assignment_id: int, employee_id: int, db: Session = Depends(get_db)):
    assignment = get_assignment_or_404(assignment_id, employee_id, db)
    campaign = db.query(PhishingCampaign).filter(PhishingCampaign.id == assignment.campaign_id).first()
    return {
        "assignment_id": assignment.id,
        "sender_name": campaign.sender_name,
        "sender_email_display": campaign.sender_email_display,
        "subject": campaign.subject,
        "message_body": campaign.message_body,
        "cta_text": campaign.cta_text,
        "email_type": campaign.email_type,
        "is_opened": assignment.is_opened,
        "is_clicked": assignment.is_clicked,
        "is_reported_phishing": assignment.is_reported_phishing,
        "is_reported_spam": assignment.is_reported_spam,
        "result_status": assignment.result_status,
    }

@router.get("/my-result/{assignment_id}")
def get_my_result(assignment_id: int, employee_id: int, db: Session = Depends(get_db)):
    assignment = get_assignment_or_404(assignment_id, employee_id, db)
    campaign = db.query(PhishingCampaign).filter(PhishingCampaign.id == assignment.campaign_id).first()
    score = 0
    feedback = []
    if assignment.is_reported_phishing or assignment.is_reported_spam:
        score = 100
        feedback = ["Excellent! You correctly identified and reported this suspicious email.",
                    "Reporting phishing emails helps protect your entire organization."]
    elif assignment.is_clicked:
        score = 0
        feedback = ["You clicked the link in this simulated phishing email.",
                    "In a real attack this could compromise your account and your organization's data.",
                    "Always verify the sender's email address and hover over links before clicking."]
    elif assignment.is_opened:
        score = 60
        feedback = ["Good — you didn't click the link, but you didn't report it either.",
                    "Next time, use the 'Report as Phishing' option to alert your security team."]
    else:
        score = 40
        feedback = ["You haven't interacted with this email yet."]
    return {
        "assignment_id": assignment.id,
        "result_status": assignment.result_status,
        "is_opened": assignment.is_opened,
        "is_clicked": assignment.is_clicked,
        "is_reported_phishing": assignment.is_reported_phishing,
        "is_reported_spam": assignment.is_reported_spam,
        "email_type": campaign.email_type,
        "subject": campaign.subject,
        "score": score,
        "feedback": feedback,
    }

@router.post("/inbox/{assignment_id}/open")
def mark_opened(assignment_id: int, employee_id: int, db: Session = Depends(get_db)):
    assignment = get_assignment_or_404(assignment_id, employee_id, db)
    if not assignment.is_opened:
        assignment.is_opened = True
        assignment.opened_at = datetime.utcnow()
        if assignment.result_status == "pending":
            assignment.result_status = "opened"
        db.commit()
    return {"status": "opened"}

@router.post("/inbox/{assignment_id}/click")
def mark_clicked(assignment_id: int, employee_id: int, db: Session = Depends(get_db)):
    assignment = get_assignment_or_404(assignment_id, employee_id, db)
    if not assignment.is_clicked:
        assignment.is_clicked = True
        assignment.clicked_at = datetime.utcnow()
        assignment.result_status = "clicked"
        db.commit()
    return {"status": "clicked"}

@router.post("/inbox/{assignment_id}/report-phishing")
def report_phishing(assignment_id: int, employee_id: int, db: Session = Depends(get_db)):
    assignment = get_assignment_or_404(assignment_id, employee_id, db)
    assignment.is_reported_phishing = True
    assignment.reported_at = datetime.utcnow()
    assignment.result_status = "reported_phishing"
    db.commit()
    return {"status": "reported_phishing"}

@router.post("/inbox/{assignment_id}/report-spam")
def report_spam(assignment_id: int, employee_id: int, db: Session = Depends(get_db)):
    assignment = get_assignment_or_404(assignment_id, employee_id, db)
    assignment.is_reported_spam = True
    assignment.reported_at = datetime.utcnow()
    assignment.result_status = "reported_spam"
    db.commit()
    return {"status": "reported_spam"}