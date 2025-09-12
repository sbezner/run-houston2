"""
Run Houston Service Starter (ss.py)

This script automatically detects your IP address, updates the mobile app configuration,
and starts all services (Database, API, Mobile App, Web Frontend) in separate windows.

Usage:
    python ss.py           # Start services without logs (default)
    python ss.py --logs    # Start services with full logs
    python ss.py -l        # Short form for logs
    python ss.py --help    # Show help message

The script will:
1. Check Node.js version (requires 18.20.4)
2. Detect your current IP address
3. Update mobile/src/config.ts with the detected IP
4. Start Docker services (Database + API) in detached mode
5. Start Mobile App (Expo) in a separate window
6. Start Web Frontend (Vite) in a separate window
"""

import subprocess
import re
import os
import time
import sys

def check_node_version():
    """Check if the correct Node.js version is being used"""
    required_version = "18.20.4"
    
    try:
        # Check current Node version
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Node.js not found! Please install Node.js first.")
            return False
        
        current_version = result.stdout.strip()
        
        if current_version == f"v{required_version}":
            print(f"✅ Using correct Node version: {current_version}")
            return True
        else:
            print(f"⚠️  Wrong Node version detected!")
            print(f"   Current: {current_version}")
            print(f"   Required: v{required_version}")
            print()
            print("🔧 To fix this issue:")
            print(f"   1. Run: nvm use {required_version}")
            print("   2. If you don't have that version: nvm install 18.20.4")
            print("   3. Then run this script again")
            print()
            print("💡 This prevents Metro bundler and Vite compatibility issues!")
            return False
            
    except FileNotFoundError:
        print("❌ Node.js not found! Please install Node.js first.")
        print("💡 Visit: https://nodejs.org or install via nvm")
        return False
    except Exception as e:
        print(f"❌ Error checking Node version: {e}")
        return False

def check_nvm_available():
    """Check if nvm is available and provide helpful info"""
    try:
        result = subprocess.run(['nvm', 'version'], capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            print(f"📦 nvm version: {result.stdout.strip()}")
            return True
    except:
        pass
    
    print("💡 nvm not found - install from: https://github.com/coreybutler/nvm-windows")
    return False

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
        # Check if config file exists
        if not os.path.exists(config_file):
            print(f"⚠️  Config file not found: {config_file}")
            return False
            
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
            return True
        else:
            print("⚠️  Could not find backendUrl line to update")
            return False
            
    except Exception as e:
        print(f"❌ Error updating mobile config: {e}")
        return False

def start_services_in_windows(show_logs=False):
    """Start all services in separate PowerShell windows with optional log control"""
    try:
        if show_logs:
            # Show all logs
            docker_cmd = 'docker compose up'
            expo_cmd = 'npx expo start'
            web_main_cmd = 'npm run dev:main'
            web_admin_cmd = 'npm run dev:admin'
            print("📊 Starting services with full logs...")
        else:
            # Hide logs (default) but always show Expo QR code
            docker_cmd = 'docker compose up -d'
            expo_cmd = 'npx expo start'  # Always show QR code for mobile
            web_main_cmd = 'npm run dev:main --silent'
            web_admin_cmd = 'npm run dev:admin --silent'
            print("🔇 Starting services without logs (except mobile QR code)...")
        
        # Start Database & API together using Docker Compose
        subprocess.Popen([
            'powershell', '-NoExit', '-Command',
            f'cd "C:/Users/sbezn/OneDrive/Documents/vsCodeProjects/run-houston/infra"; Write-Host "Starting Database & API with Docker..." -ForegroundColor Green; {docker_cmd}'
        ])
        
        # Wait a moment for Docker services to start
        print("⏳ Waiting for database and API to initialize...")
        time.sleep(8)  # Increased wait time for versioning system to load
        
        # Start Mobile App in second window
        subprocess.Popen([
            'powershell', '-NoExit', '-Command',
            f'cd "C:/Users/sbezn/OneDrive/Documents/vsCodeProjects/run-houston/mobile"; Write-Host "Starting Mobile App..." -ForegroundColor Blue; {expo_cmd}'
        ])
        
        # Start Main Web App (localhost:5173)
        subprocess.Popen([
            'powershell', '-NoExit', '-Command',
            f'cd "C:/Users/sbezn/OneDrive/Documents/vsCodeProjects/run-houston/web"; Write-Host "Starting Main Web App (localhost:5173)..." -ForegroundColor Green; {web_main_cmd}'
        ])
        
        # Start Admin Web App (localhost:5174)
        subprocess.Popen([
            'powershell', '-NoExit', '-Command',
            f'cd "C:/Users/sbezn/OneDrive/Documents/vsCodeProjects/run-houston/web"; Write-Host "Starting Admin Web App (localhost:5174)..." -ForegroundColor Magenta; {web_admin_cmd}'
        ])
        
        log_status = "with logs" if show_logs else "without logs"
        print(f"🚀 All services started in separate windows {log_status}!")
        print("📱 Mobile app will use the updated IP address")
        print("🐳 Database & API are running in Docker")
        print("📊 Versioning system is active - check monitoring dashboards!")
        print("🔗 Quick links:")
        print("   • Main App: http://localhost:5173")
        print("   • Admin App: http://localhost:5174")
        print("   • API Health: http://localhost:8000/health")
        print("   • API Version: http://localhost:8000/api/v1/version")
        
        return True
        
    except Exception as e:
        print(f"❌ Error starting services: {e}")
        return False

def main():
    # Check for help parameter
    if '--help' in sys.argv or '-h' in sys.argv:
        print("🚀 Run Houston Service Starter")
        print("Usage: python ss.py [options]")
        print("\nOptions:")
        print("  --logs, -l    Show all service logs (default: logs hidden, QR code always shown)")
        print("  --help, -h    Show this help message")
        print("\nExamples:")
        print("  python ss.py           # Start services without logs (QR code always shown)")
        print("  python ss.py --logs    # Start services with full logs")
        print("  python ss.py -l        # Short form for logs")
        print("\nRequirements:")
        print("  • Node.js 18.20.4 (locked version)")
        print("  • Docker Desktop running")
        print("  • All dependencies installed")
        return
    
    print("🚀 Run Houston Service Starter")
    print("=" * 50)
    
    # Step 1: Check Node version FIRST
    print("🔍 Checking Node.js version...")
    if not check_node_version():
        print("\n❌ Cannot proceed with wrong Node version!")
        print("🔧 Please fix Node version and try again.")
        check_nvm_available()  # Show nvm info if available
        sys.exit(1)
    
    # Step 2: Check for logs parameter
    show_logs = '--logs' in sys.argv or '-l' in sys.argv
    
    # Step 3: Get current IP
    print("🔍 Detecting current IP address...")
    current_ip = get_current_ip()
    if not current_ip:
        print("❌ Failed to get IP address. Exiting.")
        sys.exit(1)
    
    print(f"📍 Current IP: {current_ip}")
    
    # Step 4: Update mobile config
    print("📝 Updating mobile app configuration...")
    if not update_mobile_config(current_ip):
        print("⚠️  Mobile config update failed, but continuing...")
    
    # Step 5: Start services with log control
    print("🚀 Starting all services...")
    if not start_services_in_windows(show_logs):
        print("❌ Failed to start some services!")
        sys.exit(1)
    
    print("\n✨ Setup complete! Your services are starting in separate PowerShell windows.")
    print("💡 Remember: If your IP changes again, just run this script again!")
    print("💡 Tip: Use 'python ss.py --logs' to see all service logs")
    print("🔒 Version Lock: Node 18.20.4, Vite 4.5.5 - DO NOT upgrade!")

if __name__ == "__main__":
    main()