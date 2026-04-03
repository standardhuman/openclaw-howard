#!/usr/bin/env bash
# Paperclip Status Reporter for Matrix
# Fetches status from Paperclip API and formats for Matrix delivery

PAPERCLIP_URL="http://127.0.0.1:3101"

companies=$(curl -s "$PAPERCLIP_URL/api/companies")

output=""

echo "$companies" | python3 -c "
import json, sys, urllib.request

PAPERCLIP_URL = 'http://127.0.0.1:3100'
companies = json.load(sys.stdin)

for co in companies:
    cid = co['id']
    name = co['name']
    prefix = co.get('prefix', '?')
    
    # Get issues
    issues = json.loads(urllib.request.urlopen(f'{PAPERCLIP_URL}/api/companies/{cid}/issues').read())
    
    # Get agents
    agents = json.loads(urllib.request.urlopen(f'{PAPERCLIP_URL}/api/companies/{cid}/agents').read())
    agent_map = {a['id']: a['name'] for a in agents}
    
    # Get routines  
    routines = json.loads(urllib.request.urlopen(f'{PAPERCLIP_URL}/api/companies/{cid}/routines').read())
    
    # Count by status
    todo = [i for i in issues if i['status'] == 'todo']
    in_progress = [i for i in issues if i['status'] == 'in_progress']
    done = [i for i in issues if i['status'] == 'done']
    critical = [i for i in issues if i.get('priority') == 'critical']
    
    print(f'**{name}** ({prefix})')
    print(f'  📋 {len(todo)} todo | 🔨 {len(in_progress)} in progress | ✅ {len(done)} done')
    
    if critical:
        print(f'  🚨 Critical: {len(critical)}')
        for c in critical:
            assignee = agent_map.get(c.get('assigneeAgentId'), 'unassigned')
            print(f'    - {c[\"title\"]} [{assignee}]')
    
    if in_progress:
        print(f'  Active work:')
        for ip in in_progress:
            assignee = agent_map.get(ip.get('assigneeAgentId'), 'unassigned')
            print(f'    - {ip[\"title\"]} [{assignee}]')
    
    # Recent activity from routines
    active_routines = [r for r in routines if r.get('status') == 'active']
    print(f'  ⏰ {len(active_routines)} active routines')
    print()
"
