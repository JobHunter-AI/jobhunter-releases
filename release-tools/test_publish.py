import unittest
from publish import expected,validate_names,validate_url
class ReleasePolicy(unittest.TestCase):
 def test_missing_windows_fails(self):
  names=expected('0.6.33');names.remove('jobhunter-0.6.33-windows-x86_64-setup.exe')
  with self.assertRaises(ValueError):validate_names(names,'0.6.33')
 def test_source_assets_fail(self):
  with self.assertRaises(ValueError):validate_names(expected('0.6.33')|{'source.zip'},'0.6.33')
 def test_exact_binary_set(self):validate_names(expected('0.6.33'),'0.6.33')
 def test_untrusted_download_fails(self):
  for url in ['http://localhost/file','https://example.com/file']:
   with self.assertRaises(ValueError):validate_url(url)
if __name__=='__main__':unittest.main()
