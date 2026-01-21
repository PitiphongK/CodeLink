import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
  size?: number;
}

/**
 * Parse GitHub URL to extract owner, repo, and optional file path
 */
function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string; path?: string } | null {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('github.com')) {
      return null;
    }

    const parts = urlObj.pathname.split('/').filter(Boolean);
    
    // Minimum: /owner/repo
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1];
    
    // Check for /blob/branch/path or /tree/branch/path
    if (parts.length > 3 && (parts[2] === 'blob' || parts[2] === 'tree')) {
      const branch = parts[3];
      const path = parts.slice(4).join('/');
      return { owner, repo, branch, path };
    }

    return { owner, repo };
  } catch {
    return null;
  }
}

/**
 * Fetch file content from GitHub
 */
async function fetchFileContent(owner: string, repo: string, path: string, branch = 'main'): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CodeLink',
    },
  });

  if (!response.ok) {
    // Try master branch if main fails
    if (branch === 'main') {
      return fetchFileContent(owner, repo, path, 'master');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.type !== 'file') {
    throw new Error('Path points to a directory, not a file');
  }

  // Decode base64 content
  if (data.content) {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }

  // Fallback to download_url
  if (data.download_url) {
    const contentResponse = await fetch(data.download_url);
    return contentResponse.text();
  }

  throw new Error('Unable to fetch file content');
}

/**
 * List files in a directory
 */
async function listFiles(owner: string, repo: string, path = '', branch = 'main'): Promise<GitHubFile[]> {
  const url = path
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    : `https://api.github.com/repos/${owner}/${repo}/contents?ref=${branch}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'CodeLink',
    },
  });

  if (!response.ok) {
    // Try master branch if main fails
    if (branch === 'main') {
      return listFiles(owner, repo, path, 'master');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!Array.isArray(data)) {
    throw new Error('Path is not a directory');
  }

  return data.map((item: any) => ({
    name: item.name,
    path: item.path,
    type: item.type === 'dir' ? 'dir' : 'file',
    download_url: item.download_url,
    size: item.size,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl, filePath, action } = body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const { owner, repo, branch, path: urlPath } = parsed;
    
    // Determine the actual directory/file path
    const targetPath = filePath || urlPath || '';

    // List files action
    if (action === 'list' || (!filePath && targetPath)) {
      const files = await listFiles(owner, repo, targetPath, branch);
      return NextResponse.json({ 
        type: 'list', 
        files,
        currentPath: targetPath,
        branch: branch || 'main'
      });
    }

    // If no path specified, list root
    if (!targetPath) {
      const files = await listFiles(owner, repo, '', branch);
      return NextResponse.json({ 
        type: 'list', 
        files,
        currentPath: '',
        branch: branch || 'main'
      });
    }

    // Fetch specific file
    const content = await fetchFileContent(owner, repo, targetPath, branch);
    
    return NextResponse.json({
      type: 'file',
      content,
      filename: targetPath.split('/').pop() || 'file',
      path: targetPath,
    });
  } catch (error) {
    console.error('GitHub import error:', error);
    const message = error instanceof Error ? error.message : 'Failed to import from GitHub';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
