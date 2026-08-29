UPDATE credential_definitions
SET requirements_json='{"requires_diagnostic":{"version":"2.0"},"requires_credentials":["foundations","essentials","applied","role_lab"],"requires_role_lab":{"key":"ib-project-northstar","version":"2.0","minimum":80},"requires_assessment":{"key":"ib-professional-final","minimum":80},"requires_readiness":{"minimum":80,"evidence_coverage":1.0,"critical_floors":true}}', updated_at=CURRENT_TIMESTAMP
WHERE id='ib-professional-readiness-v2';
