ALTER TABLE "AuditLog" DROP CONSTRAINT audit_fields;

ALTER TABLE "AuditLog" ADD CONSTRAINT audit_fields CHECK (
  "changedFields" <@ ARRAY[
    'status','startAt','endAt','meetingMode','placeName','visitAddress','phoneDirection','advisorPhone',
    'onlineUrl','onlineProvider','firstName','lastName','phone','address','remarks','guests',
    'managementToken','recipientSelection','personalData','profile','service','relation','availability',
    'name','email','role','active','profileId','canManageOwnServices','securityGeneration',
    'imageKey','password','settings'
  ]
);
