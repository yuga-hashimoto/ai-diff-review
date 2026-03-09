import { describe, it, expect } from 'vitest';
import { parseDiff } from '../parser.js';

describe('parseDiff', () => {
  it('should parse a simple file modification', () => {
    const diff = `diff --git a/src/index.ts b/src/index.ts
index abc1234..def5678 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
 import { foo } from './foo';
+import { bar } from './bar';
 
 export function main() {
`;
    const result = parseDiff(diff);
    expect(result).toHaveLength(1);
    expect(result[0].oldPath).toBe('src/index.ts');
    expect(result[0].newPath).toBe('src/index.ts');
    expect(result[0].isNew).toBe(false);
    expect(result[0].isDeleted).toBe(false);
    expect(result[0].isBinary).toBe(false);
    expect(result[0].language).toBe('typescript');
    expect(result[0].chunks).toHaveLength(1);
    expect(result[0].chunks[0].changes.some(c => c.type === 'add' && c.content.includes('bar'))).toBe(true);
  });

  it('should parse a new file', () => {
    const diff = `diff --git a/src/new.ts b/src/new.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/new.ts
@@ -0,0 +1,3 @@
+export const hello = 'world';
+export const foo = 42;
+export const bar = true;
`;
    const result = parseDiff(diff);
    expect(result).toHaveLength(1);
    expect(result[0].isNew).toBe(true);
    expect(result[0].isDeleted).toBe(false);
    expect(result[0].newPath).toBe('src/new.ts');
    expect(result[0].chunks).toHaveLength(1);
    expect(result[0].chunks[0].changes).toHaveLength(3);
    expect(result[0].chunks[0].changes.every(c => c.type === 'add')).toBe(true);
  });

  it('should parse a deleted file', () => {
    const diff = `diff --git a/src/old.ts b/src/old.ts
deleted file mode 100644
index abc1234..0000000
--- a/src/old.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-export const removed = true;
-export const gone = false;
`;
    const result = parseDiff(diff);
    expect(result).toHaveLength(1);
    expect(result[0].isDeleted).toBe(true);
    expect(result[0].oldPath).toBe('src/old.ts');
    expect(result[0].chunks[0].changes).toHaveLength(2);
    expect(result[0].chunks[0].changes.every(c => c.type === 'delete')).toBe(true);
  });

  it('should parse multiple files', () => {
    const diff = `diff --git a/a.ts b/a.ts
index 1111111..2222222 100644
--- a/a.ts
+++ b/a.ts
@@ -1,2 +1,2 @@
-const x = 1;
+const x = 2;
 const y = 3;
diff --git a/b.ts b/b.ts
index 3333333..4444444 100644
--- a/b.ts
+++ b/b.ts
@@ -1,2 +1,2 @@
 const a = 'hello';
-const b = 'world';
+const b = 'universe';
`;
    const result = parseDiff(diff);
    expect(result).toHaveLength(2);
    expect(result[0].newPath).toBe('a.ts');
    expect(result[1].newPath).toBe('b.ts');
  });

  it('should parse multiple chunks in a single file', () => {
    const diff = `diff --git a/big.ts b/big.ts
index aaa..bbb 100644
--- a/big.ts
+++ b/big.ts
@@ -1,3 +1,4 @@
 line1
+added1
 line2
 line3
@@ -10,3 +11,4 @@
 line10
+added2
 line11
 line12
`;
    const result = parseDiff(diff);
    expect(result).toHaveLength(1);
    expect(result[0].chunks).toHaveLength(2);
    expect(result[0].chunks[0].newStart).toBe(1);
    expect(result[0].chunks[1].newStart).toBe(11);
  });

  it('should return empty array for empty input', () => {
    expect(parseDiff('')).toHaveLength(0);
    expect(parseDiff('   ')).toHaveLength(0);
  });

  it('should handle binary file diffs gracefully', () => {
    const diff = `diff --git a/image.png b/image.png
new file mode 100644
index 0000000..abc1234
Binary files /dev/null and b/image.png differ
`;
    const result = parseDiff(diff);
    expect(result).toHaveLength(1);
    expect(result[0].isBinary).toBe(true);
    expect(result[0].chunks).toHaveLength(0);
  });

  it('should detect language from file extension', () => {
    const diff = `diff --git a/app.py b/app.py
index aaa..bbb 100644
--- a/app.py
+++ b/app.py
@@ -1,1 +1,1 @@
-x = 1
+x = 2
`;
    const result = parseDiff(diff);
    expect(result[0].language).toBe('python');
  });

  it('should set unknown language for unrecognized extensions', () => {
    const diff = `diff --git a/data.xyz b/data.xyz
index aaa..bbb 100644
--- a/data.xyz
+++ b/data.xyz
@@ -1,1 +1,1 @@
-old
+new
`;
    const result = parseDiff(diff);
    expect(result[0].language).toBe('unknown');
  });

  it('should track line numbers correctly in changes', () => {
    const diff = `diff --git a/f.ts b/f.ts
index aaa..bbb 100644
--- a/f.ts
+++ b/f.ts
@@ -5,4 +5,5 @@
 context line 5
-deleted line 6
+added line 6a
+added line 6b
 context line 7
 context line 8
`;
    const result = parseDiff(diff);
    const changes = result[0].chunks[0].changes;
    expect(changes[0].type).toBe('context');
    expect(changes[0].oldLine).toBe(5);
    expect(changes[0].newLine).toBe(5);
    expect(changes[1].type).toBe('delete');
    expect(changes[1].oldLine).toBe(6);
    expect(changes[2].type).toBe('add');
    expect(changes[2].newLine).toBe(6);
    expect(changes[3].type).toBe('add');
    expect(changes[3].newLine).toBe(7);
  });

  it('should handle chunk header content', () => {
    const diff = `diff --git a/f.ts b/f.ts
index aaa..bbb 100644
--- a/f.ts
+++ b/f.ts
@@ -1,3 +1,3 @@ function hello()
 context
-old
+new
 context
`;
    const result = parseDiff(diff);
    expect(result[0].chunks[0].header).toBe('function hello()');
  });
});
