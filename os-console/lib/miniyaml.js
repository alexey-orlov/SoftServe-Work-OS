// YAML loading for the console — a small dependency-free parser covering the
// subset the OS registries actually use: block mappings/sequences, nested
// blocks, quoted + plain scalars, flow [] / {}, comments, booleans/ints/
// floats/null, block scalars, and bare dates (returned as the ISO-8601 string
// their JSON form uses, e.g. 2026-08-20T00:00:00.000Z). Anchors, tags, and
// multi-doc streams are out of scope — the registries never use them.
// Deliberately NOT a full YAML library: js-yaml's Date objects and YAML-1.1
// semantics would change the shapes the frontend has always seen, and this
// parser is the one that has been running against these exact registries.

const BOOL = { true: true, True: true, TRUE: true, false: false, False: false, FALSE: false };
const NULLS = new Set(['null', 'Null', 'NULL', '~']);
const INT_RE = /^[+-]?\d+$/;
const FLOAT_RE = /^[+-]?(\d+\.\d*|\.\d+|\d+)([eE][+-]?\d+)$|^[+-]?(\d+\.\d*|\.\d+)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TS_RE = /^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

/** Bare dates/timestamps come back as full ISO-8601 UTC strings
 *  (e.g. 2026-08-20T00:00:00.000Z) — the form the frontend has always seen. */
function isoLike(s) {
  if (DATE_RE.test(s)) return `${s}T00:00:00.000Z`;
  const cleaned = s.replace(' ', 'T');
  const t = Date.parse(/(Z|[+-]\d{2}:?\d{2})$/.test(cleaned) ? cleaned : `${cleaned}Z`);
  return Number.isNaN(t) ? s : new Date(t).toISOString();
}

export function load(text) {
  return parse(text);
}

export function parse(text) {
  const lines = String(text ?? '').split('\n');
  return parseBlock(lines, 0, 0)[0];
}

function indentOf(line) {
  const stripped = line.replace(/^ +/, '');
  return [line.length - stripped.length, stripped];
}

function skippable(line) {
  const s = line.trim();
  return s === '' || s.startsWith('#');
}

function stripComment(s) {
  let quote = null;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (quote) {
      if (quote === '"' && c === '\\') {
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '#' && (i === 0 || s[i - 1] === ' ' || s[i - 1] === '\t')) {
      return s.slice(0, i).replace(/\s+$/, '');
    }
    i += 1;
  }
  return s.replace(/\s+$/, '');
}

function parseBlock(lines, i, minIndent) {
  while (i < lines.length && skippable(lines[i])) i += 1;
  if (i >= lines.length) return [null, i];
  const [indent, content] = indentOf(lines[i]);
  if (indent < minIndent) return [null, i];
  if (content === '-' || content.startsWith('- ')) return parseSeq(lines, i, indent);
  return parseMapLines(lines, i, indent);
}

function parseSeq(lines, i, indent) {
  const out = [];
  while (i < lines.length) {
    if (skippable(lines[i])) {
      i += 1;
      continue;
    }
    const [ind, content] = indentOf(lines[i]);
    if (ind !== indent || !(content === '-' || content.startsWith('- '))) break;
    const afterDash = content.slice(1).replace(/^\s+/, '');
    const rest = stripComment(afterDash);
    if (rest === '') {
      const [val, ni] = parseBlock(lines, i + 1, indent + 1);
      out.push(val);
      i = ni;
      continue;
    }
    const keyPos = mapSplit(rest);
    if (keyPos !== null) {
      // "- key: value" — a mapping item; continuation keys sit at the column
      // where the inline key starts.
      const keyCol = ind + (content.length - afterDash.length);
      const [item, ni] = seqMapItem(lines, i, keyCol, rest, keyPos);
      out.push(item);
      i = ni;
      continue;
    }
    out.push(scalar(rest));
    i += 1;
  }
  return [out, i];
}

const BLOCK_MARKERS = new Set(['|', '|-', '|+', '>', '>-', '>+']);

function seqMapItem(lines, i, keyCol, firstLine, keyPos) {
  const item = {};
  const key = unquoteKey(firstLine.slice(0, keyPos).trim());
  const rest = stripComment(firstLine.slice(keyPos + 1).trim());
  i += 1;
  if (rest === '') {
    let [val, ni] = parseBlock(lines, i, keyCol + 1);
    i = ni;
    if (val === null) {
      [val, i] = sameIndentSeq(lines, i, keyCol);
    }
    item[key] = val;
  } else if (BLOCK_MARKERS.has(rest)) {
    const [val, ni] = blockScalar(lines, i, keyCol, rest);
    item[key] = val;
    i = ni;
  } else {
    item[key] = scalar(rest);
  }
  const [more, ni2] = parseMapLines(lines, i, keyCol);
  Object.assign(item, more);
  return [item, ni2];
}

/** YAML allows a block sequence at its parent key's own indentation
 *  (`steps:` / `- checkout: ...`). Called when nothing deeper was found. */
function sameIndentSeq(lines, i, indent) {
  let j = i;
  while (j < lines.length && skippable(lines[j])) j += 1;
  if (j < lines.length) {
    const [ind, content] = indentOf(lines[j]);
    if (ind === indent && (content === '-' || content.startsWith('- '))) {
      return parseSeq(lines, j, ind);
    }
  }
  return [null, i];
}

function parseMapLines(lines, i, indent) {
  const out = {};
  while (i < lines.length) {
    if (skippable(lines[i])) {
      i += 1;
      continue;
    }
    const [ind, raw] = indentOf(lines[i]);
    if (ind !== indent || raw === '-' || raw.startsWith('- ')) break;
    const content = stripComment(raw);
    if (content === '') {
      i += 1;
      continue;
    }
    const keyPos = mapSplit(content);
    if (keyPos === null) break; // not a mapping line — stop rather than guess
    const key = unquoteKey(content.slice(0, keyPos).trim());
    const rest = content.slice(keyPos + 1).trim();
    if (rest === '') {
      let [val, ni] = parseBlock(lines, i + 1, ind + 1);
      i = ni;
      if (val === null) {
        [val, i] = sameIndentSeq(lines, i, ind);
      }
      out[key] = val;
      continue;
    }
    if (BLOCK_MARKERS.has(rest)) {
      const [val, ni] = blockScalar(lines, i + 1, ind, rest);
      out[key] = val;
      i = ni;
      continue;
    }
    out[key] = scalar(rest);
    i += 1;
  }
  return [out, i];
}

/** Position of the ':' separating key from value, or null. */
function mapSplit(s) {
  let quote = null;
  for (let idx = 0; idx < s.length; idx++) {
    const c = s[idx];
    if (quote) {
      if (quote === '"' && c === '\\') continue;
      if (c === quote) quote = null;
    } else if ((c === '"' || c === "'") && idx === 0) {
      quote = c;
    } else if (c === ':' && (idx + 1 === s.length || s[idx + 1] === ' ' || s[idx + 1] === '\t')) {
      return idx;
    }
  }
  return null;
}

function unquoteKey(k) {
  if (k.length >= 2 && k[0] === k[k.length - 1] && (k[0] === '"' || k[0] === "'")) {
    return k.slice(1, -1);
  }
  return k;
}

function blockScalar(lines, i, parentIndent, marker) {
  const folded = marker[0] === '>';
  const chomp = marker.length > 1 ? marker[1] : '';
  const body = [];
  let base = null;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      body.push('');
      i += 1;
      continue;
    }
    const [ind] = indentOf(line);
    if (ind <= parentIndent) break;
    if (base === null) base = ind;
    body.push(line.slice(base));
    i += 1;
  }
  while (body.length && body[body.length - 1] === '') body.pop();
  let text = folded ? body.join(' ') : body.join('\n');
  if (chomp !== '-') text += '\n';
  return [text, i];
}

function splitFlow(s) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let buf = '';
  for (const c of s) {
    if (quote) {
      buf += c;
      if (quote === '"' && c === '\\') {
        quote = '"\\';
        continue;
      }
      if (quote === '"\\') {
        quote = '"';
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      buf += c;
    } else if (c === '[' || c === '{') {
      depth += 1;
      buf += c;
    } else if (c === ']' || c === '}') {
      depth -= 1;
      buf += c;
    } else if (c === ',' && depth === 0) {
      parts.push(buf);
      buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim() !== '') parts.push(buf);
  return parts.map((p) => p.trim());
}

function scalar(input) {
  const s = input.trim();
  if (s === '') return null;
  if (s[0] === '"') return doubleQuoted(s);
  if (s[0] === "'") {
    const end = singleEnd(s);
    return s.slice(1, end).replace(/''/g, "'");
  }
  if (s[0] === '[') {
    const inner = s.includes(']') ? s.slice(1, s.lastIndexOf(']')) : s.slice(1);
    if (inner.trim() === '') return [];
    return splitFlow(inner).map(scalar);
  }
  if (s[0] === '{') {
    const inner = s.includes('}') ? s.slice(1, s.lastIndexOf('}')) : s.slice(1);
    if (inner.trim() === '') return {};
    const out = {};
    for (const part of splitFlow(inner)) {
      const split = mapSplit(part);
      const pos = split !== null ? split : part.indexOf(':');
      if (pos < 0) out[unquoteKey(part)] = null;
      else out[unquoteKey(part.slice(0, pos).trim())] = scalar(part.slice(pos + 1).trim());
    }
    return out;
  }
  if (Object.prototype.hasOwnProperty.call(BOOL, s)) return BOOL[s];
  if (NULLS.has(s)) return null;
  if (INT_RE.test(s)) return parseInt(s, 10);
  if (FLOAT_RE.test(s)) return parseFloat(s);
  if (DATE_RE.test(s) || TS_RE.test(s)) return isoLike(s);
  return s;
}

const ESCAPES = { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\' };

function doubleQuoted(s) {
  const out = [];
  let i = 1;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\' && i + 1 < s.length) {
      const n = s[i + 1];
      out.push(Object.prototype.hasOwnProperty.call(ESCAPES, n) ? ESCAPES[n] : '\\' + n);
      i += 2;
      continue;
    }
    if (c === '"') break;
    out.push(c);
    i += 1;
  }
  return out.join('');
}

function singleEnd(s) {
  let i = 1;
  while (i < s.length) {
    if (s[i] === "'") {
      if (i + 1 < s.length && s[i + 1] === "'") {
        i += 2;
        continue;
      }
      return i;
    }
    i += 1;
  }
  return s.length;
}
