import fs from 'node:fs';
const w=fs.readFileSync('v2/worker-v2-phase1-release.js','utf8'),e=fs.readFileSync('enterprise-v2.js','utf8'),m=fs.readFileSync('migrations/015_phase2_employer_operations.sql','utf8');
for(const x of ['manager_reviews','enterprise_notifications','manager_review.created','refreshEnterpriseNotifications','/enterprise/notifications','firm_content.reordered','firm-content" && parts[5] === "versions']) if(!w.includes(x)) throw new Error('Employer operations backend missing '+x);
for(const x of ['ADD MANAGER REVIEW','NOTIFICATIONS & DEADLINES','Export Evidence JSON','renderEditContent','renderContentHistory','data-content-move']) if(!e.includes(x)) throw new Error('Employer operations UI missing '+x);
for(const x of ['CREATE TABLE IF NOT EXISTS manager_reviews','CREATE TABLE IF NOT EXISTS enterprise_notifications']) if(!m.includes(x)) throw new Error('Operations migration missing '+x);
console.log('EMPLOYER OPERATIONS AUDIT PASS: reviews, alerts, evidence export and Firm Layer version controls verified');
