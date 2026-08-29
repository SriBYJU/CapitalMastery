UPDATE credential_definitions
SET requirements_json='{"requires_credentials":["essentials","applied"],"requires_role_lab":{"key":"ib-project-northstar","version":"2.0","minimum":80}}', updated_at=CURRENT_TIMESTAMP
WHERE id='ib-role-lab-v2';
