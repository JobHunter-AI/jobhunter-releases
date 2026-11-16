import unittest
from publish import UPDATER_ASSET,expected,plan,updater_asset,validate_names,validate_url
class ReleasePolicy(unittest.TestCase):
 def test_missing_windows_fails(self):
  names=expected('0.6.33');names.remove('jobhunter-0.6.33-windows-x86_64-setup.exe')
  with self.assertRaises(ValueError):validate_names(names,'0.6.33')
 def test_missing_windows_arm64_fails(self):
  names=expected('0.6.42');names.remove('jobhunter-0.6.42-windows-aarch64-setup.exe')
  with self.assertRaises(ValueError):validate_names(names,'0.6.42')
 def test_updater_platforms_map_to_own_installer(self):
  self.assertEqual(set(UPDATER_ASSET),{'darwin-aarch64','darwin-x86_64','windows-x86_64','windows-aarch64'})
  self.assertEqual(updater_asset('windows-aarch64','0.6.42'),'jobhunter-0.6.42-windows-aarch64-setup.exe')
  self.assertEqual(updater_asset('windows-x86_64','0.6.42'),'jobhunter-0.6.42-windows-x86_64-setup.exe')
  for p in UPDATER_ASSET:self.assertIn(updater_asset(p,'0.6.42'),expected('0.6.42'))
 def test_source_assets_fail(self):
  with self.assertRaises(ValueError):validate_names(expected('0.6.33')|{'source.zip'},'0.6.33')
 def test_exact_binary_set(self):validate_names(expected('0.6.33'),'0.6.33')
 def test_untrusted_download_fails(self):
  for url in ['http://localhost/file','https://example.com/file']:
   with self.assertRaises(ValueError):validate_url(url)
 def test_every_publication_is_formal(self):
  self.assertEqual(plan(None),'create')
  self.assertEqual(plan({'isPrerelease':True,'assets':[]}),'promote')
  self.assertEqual(plan({'isPrerelease':False,'assets':[]}),'verify')
if __name__=='__main__':unittest.main()
