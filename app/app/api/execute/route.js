import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = promisify(exec);

// Blue Wing Local Script Runner
const ALLOWED_COMMANDS = {
    'compile': 'npx hardhat compile',
    'audit': 'npm audit',
    'test': 'npx hardhat test',
    'status': 'git status'
};

export async function POST(req) {
    try {
        const { action, command: rawCommand, text, key, code, lang } = await req.json();
        
        let command = ALLOWED_COMMANDS[action];
        
        // ── Code Execution Engine ──
        if (action === 'run-code' && code && lang) {
            const ext = lang === 'python' ? 'py' : (lang === 'javascript' || lang === 'node' ? 'js' : 'txt');
            const tmpDir = path.join(process.cwd(), '.bw_runtime');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
            
            const tmpFile = path.join(tmpDir, `script_${Date.now()}.${ext}`);
            fs.writeFileSync(tmpFile, code);
            
            command = lang === 'python' ? `python "${tmpFile}"` : `node "${tmpFile}"`;
            
            // Execute and then clean up
            try {
                const { stdout, stderr } = await execPromise(command);
                // fs.unlinkSync(tmpFile); // Keep for logs or clean up later
                return NextResponse.json({
                    status: 'Success',
                    output: stdout || stderr,
                    hash: `BW-CODE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
                });
            } catch (err) {
                return NextResponse.json({ error: 'Execution Failed', details: err.message }, { status: 500 });
            }
        }

        // Sovereign Mode: Allow raw command execution
        if (action === 'raw' && rawCommand) {
            command = rawCommand;
        }

        // Keyboard Simulation: Type text
        if (action === 'type' && text) {
            const escapedText = text.replace(/'/g, "''");
            command = `powershell -c "$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys('${escapedText}')"`;
        }

        // Keyboard Simulation: Press Key
        if (action === 'press' && key) {
            const keyMap = { 'enter': '~', 'tab': '{TAB}', 'backspace': '{BACKSPACE}', 'esc': '{ESC}' };
            const k = keyMap[key.toLowerCase()] || '~';
            command = `powershell -c "$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys('${k}')"`;
        }

        if (!command) {
            return NextResponse.json({ error: 'Command not in MISSION PROFILE.' }, { status: 403 });
        }

        console.log(`Blue Wing executing: ${command}`);
        const { stdout, stderr } = await execPromise(command, { cwd: process.cwd() });

        return NextResponse.json({
            status: 'Success',
            command: action,
            output: stdout || stderr,
            hash: `BW-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        });

    } catch (error) {
        return NextResponse.json({ 
            error: 'Execution Failed', 
            details: error.message 
        }, { status: 500 });
    }
}
