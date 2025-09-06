#!/usr/bin/env python3
"""
Database reader utility for Run Houston project.
Provides a read_db() function to execute SELECT queries and return pretty formatted tables.
"""

import subprocess
import sys
from typing import Optional, List, Dict, Any
from tabulate import tabulate

def read_db(sql_query: str) -> Optional[str]:
    """
    Execute a SELECT query against the Run Houston PostgreSQL database container.
    Returns results as a pretty formatted table.
    
    Args:
        sql_query (str): The SELECT query to execute
    
    Returns:
        Optional[str]: Query results as pretty formatted table, or None if error occurred
    """
    # Ensure it's a SELECT query for safety
    if not sql_query.strip().upper().startswith('SELECT'):
        print("❌ Error: Only SELECT queries are allowed for reading data", file=sys.stderr)
        return None
    
    cmd = [
        'docker', 'exec', 'runhou_db',
        'psql', '-U', 'rh_user', '-d', 'runhou',
        '-t', '-A', '-F', '|',  # Pipe-separated output
        '-c', sql_query
    ]
    
    try:
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            check=True,
            timeout=30
        )
        
        # Parse the pipe-separated output
        return format_as_table(result.stdout.strip())
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Database query failed:", file=sys.stderr)
        print(f"Error: {e.stderr}", file=sys.stderr)
        print(f"Query: {sql_query}", file=sys.stderr)
        return None
        
    except subprocess.TimeoutExpired:
        print(f"⏰ Query timed out after 30 seconds", file=sys.stderr)
        print(f"Query: {sql_query}", file=sys.stderr)
        return None
        
    except FileNotFoundError:
        print("❌ Docker not found. Make sure Docker is installed and running.", file=sys.stderr)
        return None

def format_as_table(raw_output: str) -> str:
    """
    Convert pipe-separated output to a pretty table.
    
    Args:
        raw_output (str): Raw pipe-separated output from psql
    
    Returns:
        str: Pretty formatted table
    """
    if not raw_output.strip():
        return "No data returned"
    
    lines = raw_output.strip().split('\n')
    if not lines or not lines[0].strip():
        return "No data returned"
    
    # Split each line by pipe separator
    rows = []
    for line in lines:
        if line.strip():
            # Split by pipe and strip whitespace
            row = [cell.strip() for cell in line.split('|')]
            rows.append(row)
    
    if not rows:
        return "No data returned"
    
    # Use tabulate to create a pretty table
    try:
        # First row as headers, rest as data
        headers = rows[0] if len(rows) > 1 else []
        data = rows[1:] if len(rows) > 1 else rows
        
        table = tabulate(
            data, 
            headers=headers, 
            tablefmt='plain',
            stralign='left',
            numalign='left'
        )
        return table
    except Exception as e:
        # Fallback to simple formatting if tabulate fails
        return "\n".join([" | ".join(row) for row in rows])

# Main execution
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python read_db.py \"SELECT_QUERY\"")
        print("Example: python read_db.py \"SELECT name, date FROM races LIMIT 5;\"")
        print("Note: Only SELECT queries are allowed for safety")
        sys.exit(1)
    
    sql_query = sys.argv[1]
    result = read_db(sql_query)
    
    if result is not None:
        print(result)
    else:
        sys.exit(1)