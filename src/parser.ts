import { DiffFile, DiffChunk, DiffChange } from './types.js';

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.jsx': 'javascript',
  '.py': 'python', '.rs': 'rust', '.go': 'go', '.java': 'java',
  '.rb': 'ruby', '.php': 'php', '.cs': 'csharp', '.cpp': 'cpp',
  '.c': 'c', '.swift': 'swift', '.kt': 'kotlin', '.scala': 'scala',
  '.vue': 'vue', '.svelte': 'svelte', '.md': 'markdown',
  '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml',
  '.sql': 'sql', '.sh': 'bash', '.bash': 'bash',
};

function detectLanguage(filePath: string): string {
  const dotIdx = filePath.lastIndexOf('.');
  if (dotIdx === -1) return 'unknown';
  const ext = filePath.substring(dotIdx);
  return LANGUAGE_MAP[ext] ?? 'unknown';
}

/**
 * Parse unified diff format into structured DiffFile objects.
 * Handles new files, deleted files, binary files, renames, and multi-chunk diffs.
 */
export function parseDiff(diffContent: string): DiffFile[] {
  if (!diffContent || !diffContent.trim()) return [];

  const files: DiffFile[] = [];
  const lines = diffContent.split('\n');
  let currentFile: DiffFile | null = null;
  let currentChunk: DiffChunk | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // New file header
    if (line.startsWith('diff --git')) {
      if (currentFile) files.push(currentFile);

      const match = line.match(/diff --git a\/(.*?) b\/(.*)/);
      const oldPath = match?.[1] ?? 'unknown';
      const newPath = match?.[2] ?? 'unknown';

      currentFile = {
        oldPath,
        newPath,
        isNew: false,
        isDeleted: false,
        isBinary: false,
        language: detectLanguage(newPath !== '/dev/null' ? newPath : oldPath),
        chunks: [],
      };
      currentChunk = null;
      continue;
    }

    if (!currentFile) continue;

    // Detect new/deleted/binary
    if (line.startsWith('new file mode')) {
      currentFile.isNew = true;
      continue;
    }
    if (line.startsWith('deleted file mode')) {
      currentFile.isDeleted = true;
      continue;
    }
    if (line.startsWith('Binary files')) {
      currentFile.isBinary = true;
      continue;
    }

    // Update paths from --- and +++ lines
    if (line.startsWith('--- ')) {
      const path = line.substring(4);
      if (path === '/dev/null') {
        currentFile.isNew = true;
      } else if (path.startsWith('a/')) {
        currentFile.oldPath = path.substring(2);
      }
      continue;
    }
    if (line.startsWith('+++ ')) {
      const path = line.substring(4);
      if (path === '/dev/null') {
        currentFile.isDeleted = true;
      } else if (path.startsWith('b/')) {
        currentFile.newPath = path.substring(2);
      }
      continue;
    }

    // Skip index lines
    if (line.startsWith('index ') || line.startsWith('similarity ') || line.startsWith('rename ')) {
      continue;
    }

    // Chunk header
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)/);
      if (match) {
        oldLineNum = parseInt(match[1], 10);
        newLineNum = parseInt(match[3], 10);
        currentChunk = {
          oldStart: oldLineNum,
          oldLines: parseInt(match[2] || '1', 10),
          newStart: newLineNum,
          newLines: parseInt(match[4] || '1', 10),
          header: match[5]?.trim() ?? '',
          changes: [],
        };
        currentFile.chunks.push(currentChunk);
      }
      continue;
    }

    if (!currentChunk) continue;

    // Diff content lines
    if (line.startsWith('+')) {
      currentChunk.changes.push({
        type: 'add',
        content: line.substring(1),
        newLine: newLineNum,
      });
      newLineNum++;
    } else if (line.startsWith('-')) {
      currentChunk.changes.push({
        type: 'delete',
        content: line.substring(1),
        oldLine: oldLineNum,
      });
      oldLineNum++;
    } else if (line.startsWith(' ') || line === '') {
      currentChunk.changes.push({
        type: 'context',
        content: line.startsWith(' ') ? line.substring(1) : '',
        oldLine: oldLineNum,
        newLine: newLineNum,
      });
      oldLineNum++;
      newLineNum++;
    }
  }

  if (currentFile) files.push(currentFile);
  return files;
}
