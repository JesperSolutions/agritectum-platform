import subprocess
import time
import json

def deploy_extension_via_api():
    """Deploy firestore-send-email extension using Google Cloud API"""
    
    project_id = "agritectum-platform"
    project_number = "956094535116"
    instance_id = "firestore-send-email-mailersend"
    
    # Extension reference
    ext_ref = "firebase/firestore-send-email@latest"
    
    # Configuration parameters
    config = {
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
    
    # Build JSON body for extension installation
    install_request = {
        "extension_ref": ext_ref,
        "display_name": "MailerSend Email Extension",
        "config": config,
        "system_params": {
            "install_time": True
        }
    }
    
    print("🔧 Installing firestore-send-email extension via REST API...")
    print(f"Project: {project_id}")
    print(f"Instance: {instance_id}")
    print(f"Extension: {ext_ref}\n")
    
    # Try using gcloud to deploy the extension
    cmd = [
        "gcloud",
        "firebase",
        "ext",
        "install",
        ext_ref,
        f"--project={project_id}",
        f"--instance-id={instance_id}",
        "--update-repo",
        "--update-config"
    ]
    
    print(f"Running: {' '.join(cmd)}\n")
    
    try:
        result = subprocess.run(
            cmd,
            timeout=300,
            capture_output=True,
            text=True
        )
        
        print("Output:")
        print(result.stdout)
        
        if result.stderr:
            print("\nStderr:")
            print(result.stderr)
        
        if result.returncode == 0:
            print("\n✅ Extension installed successfully!")
        else:
            print(f"\n⚠️ Installation exited with code {result.returncode}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nFallback: Install manually via Firebase Console")
        print("https://console.firebase.google.com/project/agritectum-platform/extensions/install?ref=firebase/firestore-send-email")

if __name__ == "__main__":
    deploy_extension_via_api()
