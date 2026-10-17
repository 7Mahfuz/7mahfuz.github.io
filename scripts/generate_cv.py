"""
Utility script to compile cv.html into Net_CV_MahfuzurRahman.pdf using Edge/Chrome headless.
"""
import os
import subprocess
import sys

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    html_file = os.path.join(root_dir, 'cv.html')
    pdf_file = os.path.join(root_dir, 'Net_CV_MahfuzurRahman.pdf')

    if not os.path.exists(html_file):
        print(f"Error: {html_file} does not exist.")
        sys.exit(1)

    edge_candidates = [
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    ]

    browser_exe = None
    for c in edge_candidates:
        if os.path.exists(c):
            browser_exe = c
            break

    if not browser_exe:
        print("Error: Could not locate Microsoft Edge or Google Chrome executable.")
        sys.exit(1)

    print(f"Compiling {html_file} -> {pdf_file} using {browser_exe}...")
    cmd = [
        browser_exe,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        f'--print-to-pdf={pdf_file}',
        '--no-pdf-header-footer',
        html_file
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Compilation failed: {res.stderr}")
        sys.exit(res.returncode)

    if os.path.exists(pdf_file):
        set_metadata(pdf_file)
        print(f"Success! PDF created at: {pdf_file} ({os.path.getsize(pdf_file)} bytes)")
    else:
        print("Failed to produce output PDF.")
        sys.exit(1)


def set_metadata(pdf_file):
    """Add author, subject and keywords (the browser only sets the title).

    Optional: needs PyMuPDF (pip install pymupdf); without it the PDF is left as printed.
    """
    try:
        import fitz
    except ImportError:
        print("Note: PyMuPDF not installed; skipping PDF author/subject/keywords.")
        return

    doc = fitz.open(pdf_file)
    meta = doc.metadata or {}
    meta.update({
        'author': 'Al-Amin Mahfuzur Rahman',
        'subject': 'CV - Senior Software Engineer (enterprise software and mobile apps)',
        'keywords': 'Senior Software Engineer, C#, ASP.NET Core, Dynamics 365 Business Central, AL, '
                    'Flutter, Android, iOS, AWS, Google Cloud, Firebase, MS SQL Server',
    })
    doc.set_metadata(meta)
    doc.saveIncr()
    doc.close()


if __name__ == '__main__':
    main()
