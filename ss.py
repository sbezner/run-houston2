import subprocess
import re
import os
import time

def get_current_ip():
    """Get the current IPv4 address of the machine"""
    try:
        # Run ipconfig and capture output
        result = subprocess.run(['ipconfig'], capture_output=True, text=True, shell=True)
        output = result.stdout
        
        # Find IPv4 addresses (prioritize non-172.x.x.x addresses)
        ip_pattern = r'IPv4 Address[^:]*:\s*(\d+\.\d+\.\d+\.\d+)'
        ips = re.findall(ip_pattern, output)
        
        # Filter out 172.x.x.x addresses (usually Docker internal)
        valid_ips = [ip for ip in ips if not ip.startswith('172.')]
        
        if valid_ips:
            return valid_ips[0]  # Return first valid IP
        elif ips:
            return ips[0]  # Fallback to any IP if no valid ones found
        else:
            raise Exception("No IP address found")
            
    except Exception as e:
        print(f"Error getting IP address: {e}")
        return None

def update_mobile_config(ip_address):
    """Update the mobile app config with the current IP"""
    config_file = "mobile/src/config.ts"
    
    try:
        # Read current config with explicit UTF-8 encoding
        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update IP address using regex - look for the backendUrl line
        old_ip_pattern = r'backendUrl: \'http://\d+\.\d+\.\d+\.\d+:8000\''
        new_ip_line = f"backendUrl: 'http://{ip_address}:8000'"
        
        if re.search(old_ip_pattern, content):
            # Replace existing IP
            updated_content = re.sub(old_ip_pattern, new_ip_line, content)
            with open(config_file, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"✅ Updated mobile config with IP: {ip_address}")
        else:
            print("⚠️  Could not find backendUrl line to update")
            
    except Exception as e:
        print(f"❌ Error updating mobile config: {e}")

def start_services_in_windows():
    """Start all services in separate PowerShell windows"""
    try:
        # Start Database & API together using Docker Compose
        subprocess.Popen([
            'powershell', '-NoExit', '-Command',
            'cd "C:/Users/sbezn/OneDrive/Documents/vsCodeProjects/run-houston/infra"; Write-Host "Starting Database & API with Docker..." -ForegroundColor Green; docker compose up'
        ])
        
        # Wait a moment for Docker services to start
        time.sleep(5)
        
        # Start Mobile App in second window
        subprocess.Popen([
            'powershell', '-NoExit', '-Command',
            'cd "C:/Users/sbezn/OneDrive/Documents/vsCodeProjects/run-houston/mobile"; Write-Host "Starting Mobile App..." -ForegroundColor Blue; npx expo start'
        ])
        
        # Start Web Frontend in third window
        subprocess.Popen([
            'powershell', '-NoExit', '-Command',
            'cd "C:/Users/sbezn/OneDrive/Documents/vsCodeProjects/run-houston/web"; Write-Host "Starting Web Frontend..." -ForegroundColor Magenta; npm run dev'
        ])
        
        print("🚀 All services started in separate windows!")
        print("📱 Mobile app will use the updated IP address")
        print("🐳 Database & API are running in Docker (more reliable)")
        
    except Exception as e:
        print(f"❌ Error starting services: {e}")

def main():
    print("🔍 Detecting current IP address...")
    
    # Get current IP
    current_ip = get_current_ip()
    if not current_ip:
        print("❌ Failed to get IP address. Exiting.")
        return
    
    print(f"📍 Current IP: {current_ip}")
    
    # Update mobile config
    print("📝 Updating mobile app configuration...")
    update_mobile_config(current_ip)
    
    # Start services
    print("🚀 Starting all services...")
    start_services_in_windows()
    
    print("\n✨ Setup complete! Your services are starting in separate PowerShell windows.")
    print("💡 Remember: If your IP changes again, just run this script again!")

if __name__ == "__main__":
    main()
