import subprocess
import json

def install_email_extension():
    """Install firestore-send-email extension with MailerSend SMTP config"""
    
    # Extension configuration parameters
    params = {
        "FIREBASE_INSTANCE_ID": "(default)",
        "FIREBASE_INSTANCE_LOCATION": "europe-west3",
        "AUTH_TYPE": "UsernamePassword",
        "SMTP_CONNECTION_URI": "smtps://MS_JABy3i@test-yxj6lj9qdz74do2r.mlsender.net@smtp.mailersend.net:587",
        "SMTP_PASSWORD": "projects/956094535116/secrets/SMTP_PASSWORD/versions/1",
        "DEFAULT_FROM": "Agritectum ApS <noreply@agritectum.com>",
        "DEFAULT_REPLY_TO": "support@agritectum.com",
        "MAIL_COLLECTION": "mail",
        "TEMPLATES_COLLECTION": "mail-templates",
        "TTL_EXPIRE_TYPE": "week",
        "TTL_EXPIRE_VALUE": "1"
    }
    
    # Try to configure extension via REST API
    try:
        # First, attempt to check if extension exists
        result = subprocess.run(
            ["firebase", "ext:list", "--project=agritectum-platform"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        print("📋 Current extensions:")
        print(result.stdout)
        
        if "firestore-send-email" not in result.stdout:
            print("\n📦 Installing firestore-send-email extension...")
            
            # Try installing with automatic responses
            install_cmd = [
                "firebase",
                "ext:install",
                "firebase/firestore-send-email",
                "--project=agritectum-platform",
                "--quiet"
            ]
            
            # Try with non-interactive flag if available
            try:
                result = subprocess.run(
                    install_cmd,
                    timeout=180,
                    text=True,
                    capture_output=True
                )
                print("Install output:")
                print(result.stdout)
                if result.stderr:
                    print("Errors:")
                    print(result.stderr)
            except Exception as e:
                print(f"Installation attempt failed: {e}")
                print("Please install via Firebase Console:")
                print("https://console.firebase.google.com/project/agritectum-platform/extensions")
        else:
            print("✅ firestore-send-email is already installed")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    install_email_extension()
