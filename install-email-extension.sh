#!/bin/bash

# Install firestore-send-email extension with MailerSend SMTP
firebase ext:install firebase/firestore-send-email \
  --project=agritectum-platform \
  --skip-billing \
  <<EOF
europe-west3
(default)
UsernamePassword
projects/956094535116/secrets/SMTP_PASSWORD/versions/1
smtps://MS_JABy3i@test-yxj6lj9qdz74do2r.mlsender.net@smtp.mailersend.net:587
Agritectum ApS <noreply@agritectum.com>
support@agritectum.com
mail
mail-templates
week
1
EOF
