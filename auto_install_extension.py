#!/usr/bin/env python3
"""
Automates Firebase Firestore Email Extension installation with MailerSend SMTP
"""

import subprocess
import sys

def install_extension():
    """Install firestore-send-email extension with automated responses"""
    
    # Prepare input responses for interactive prompts
    # Based on the parameter prompts we saw earlier
    responses = [
        "",  # Firestore Instance ID - use default
        "",  # Firestore Instance Location - select default (Europe)
        "",  # Auth Type - select Username & Password
        "smtps://MS_JABy3i@test-yxj6lj9qdz74do2r.mlsender.net@smtp.mailersend.net:587",  # SMTP URI
        "",  # SMTP Password - skip initially
        "1",  # Secret storage location - Cloud Secret Manager
        "",  # OAuth SMTP Host - skip
        "",  # OAuth SMTP Port - skip
        "",  # Use OAuth2 secure connection - skip
        "",  # OAuth2 Client ID - skip
        "",  # OAuth2 Client Secret - skip
        "",  # OAuth2 Refresh Token - skip
    ]
    
    # Join responses with newlines
    input_data = "\n".join(responses) + "\n"
    
    print("🚀 Installing firestore-send-email extension...")
    print("=" * 60)
    
    cmd = [
        "firebase",
        "ext:install",
        "firebase/firestore-send-email",
        "--project=agritectum-platform",
        "--force"
    ]
    
    try:
        # Run firebase ext:install with piped input
        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Send responses and capture output
        output, _ = proc.communicate(input=input_data, timeout=300)
        
        print(output)
        
        if proc.returncode == 0:
            print("\n" + "=" * 60)
            print("✅ Extension installation completed successfully!")
            print("=" * 60)
            return True
        else:
            print(f"\n⚠️ Installation exited with code {proc.returncode}")
            return False
            
    except subprocess.TimeoutExpired:
        proc.kill()
        print(f"❌ Installation timeout after 300 seconds")
        return False
    except Exception as e:
        print(f"❌ Error installing extension: {e}")
        return False

if __name__ == "__main__":
    success = install_extension()
    sys.exit(0 if success else 1)
