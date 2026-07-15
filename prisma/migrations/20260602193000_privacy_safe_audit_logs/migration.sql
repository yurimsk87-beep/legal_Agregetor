CREATE FUNCTION privacy_safe_audit_snapshot(snapshot JSONB)
RETURNS JSONB
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE
    WHEN snapshot IS NULL THEN NULL
    ELSE jsonb_strip_nulls(
      jsonb_build_object(
        'id', snapshot->'id',
        'status', snapshot->'status',
        'previousStatus', snapshot->'previousStatus',
        'newStatus', snapshot->'newStatus',
        'oldStatus', snapshot->'oldStatus',
        'qualityStatus', snapshot->'qualityStatus',
        'previousQualityStatus', snapshot->'previousQualityStatus',
        'newQualityStatus', snapshot->'newQualityStatus',
        'outcome', snapshot->'outcome',
        'previousOutcome', snapshot->'previousOutcome',
        'newOutcome', snapshot->'newOutcome',
        'profileStatus', snapshot->'profileStatus',
        'previousProfileStatus', snapshot->'previousProfileStatus',
        'newProfileStatus', snapshot->'newProfileStatus',
        'isIndexable', snapshot->'isIndexable',
        'previousIsIndexable', snapshot->'previousIsIndexable',
        'newIsIndexable', snapshot->'newIsIndexable',
        'isModerated', snapshot->'isModerated',
        'previousIsModerated', snapshot->'previousIsModerated',
        'newIsModerated', snapshot->'newIsModerated',
        'containsContactAttempt', snapshot->'containsContactAttempt',
        'previousContainsContactAttempt', snapshot->'previousContainsContactAttempt',
        'newContainsContactAttempt', snapshot->'newContainsContactAttempt',
        'isDuplicate', snapshot->'isDuplicate',
        'previousIsDuplicate', snapshot->'previousIsDuplicate',
        'newIsDuplicate', snapshot->'newIsDuplicate',
        'count', snapshot->'count',
        'sourceType', snapshot->'sourceType',
        'cityId', snapshot->'cityId',
        'serviceId', snapshot->'serviceId',
        'lawyerId', snapshot->'lawyerId',
        'dateFrom', snapshot->'dateFrom',
        'dateTo', snapshot->'dateTo',
        'role', snapshot->'role',
        'actorId', snapshot->'actorId',
        'actorRole', snapshot->'actorRole',
        'requestId', snapshot->'requestId',
        'maskedEmail', snapshot->'maskedEmail',
        'emailHash', snapshot->'emailHash',
        'filters', CASE
          WHEN jsonb_typeof(snapshot->'filters') = 'object' THEN jsonb_strip_nulls(
            jsonb_build_object(
              'status', snapshot->'filters'->'status',
              'outcome', snapshot->'filters'->'outcome',
              'sourceType', snapshot->'filters'->'sourceType',
              'cityId', snapshot->'filters'->'cityId',
              'serviceId', snapshot->'filters'->'serviceId',
              'dateFrom', snapshot->'filters'->'dateFrom',
              'dateTo', snapshot->'filters'->'dateTo'
            )
          )
          ELSE NULL
        END
      )
    )
  END
$$;

UPDATE "AdminAuditLog"
SET
  "beforeSnapshot" = privacy_safe_audit_snapshot("beforeSnapshot"),
  "afterSnapshot" = privacy_safe_audit_snapshot("afterSnapshot"),
  "ip" = NULL,
  "userAgent" = NULL;

UPDATE "ModerationLog"
SET
  "reason" = CASE WHEN "reason" ~ '^[A-Z0-9_:-]{1,80}$' THEN "reason" ELSE NULL END,
  "beforeSnapshot" = privacy_safe_audit_snapshot("beforeSnapshot"),
  "afterSnapshot" = privacy_safe_audit_snapshot("afterSnapshot");

UPDATE "AnswerAuditLog"
SET "comment" = CASE WHEN "comment" ~ '^[A-Z0-9_:-]{1,80}$' THEN "comment" ELSE NULL END;

DROP FUNCTION privacy_safe_audit_snapshot(JSONB);
