import { DiffFile, DiffLine, DiffHunk } from './types.js';

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.jsx': 'javascript',
  '.py': 'python', '.rs': 'rust', '.go': 'go', '.java': 'java',
  '.rb': 'ruby', '.php': 'php', '.cs': 'csharp', '.cpp': 'cpp',
  '.c': 'c', '.swift': 'swift', '.kt': 'kotlin', '.scala': 'scala',
  '.vue': 'vue', '.svelte': 'svelte', '.md': 'markdown',
  '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml',
  '.sql': 'sql', '.sh': 'bash', '.bash': 'bash',
};

export function parseDiff(diffContent: string): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = diffContent.split('\n');
  let currentFile: DiffFile | null = null;
  let currentHunk: DiffHunk | null = null;
  let newLineNum = 0;
  let oldLineNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('diff --git')) {
      if (currentFile) files.push(currentFile);
      const match = line.match(/diff --git a\/(.*?) b\/(.*)/);
      const filePath = match?.[2] ?? 'unknown';
      const ext = '.' + filePath.split('.').pop();
      currentFile = {
        path: filePath,
        language: LANGUAGE_MAP[ext] ?? 'unknown',
        additions: [],
        deletions: [],
        hunks: [],
      };
      continue;
    }

    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)/);
      if (match) {
        oldLineNum = parseInt(match[1]);
        newLineNum = parseInt(match[3]);
        currentHunk = {
          oldStart: oldLineNum,
          oldLines: parseInt(match[2] || '1'),
          newStart: newLineNum,
          newLines: parseInt(match[4] || '1'),
          content: match[5]?.trim() ?? '',
        };
        currentFile?.hunks.push(currentHunk);
      }
      continue;
    }

    if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('index ')) {
      continue;
    }

    if (!currentFile) continue;

    if (line.startsWith('+')) {
      currentFile.additions.push({ lineNumber: newLineNum, content: line.substring(1) });
      newLineNum++;
    } else if (line.startsWith('-')) {
      currentFile.deletions.push({ lineNumber: oldLineNum, content: line.substring(1) });
      oldLineNum++;
    } else if (line.startsWith(' ')) {
      oldLineNum++;
      newLineNum++;
    }
  }

  if (currentFile) files.push(currentFile);
  return files;
}