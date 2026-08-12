project = 'Sunnie Sunday Report'
author = '/xivg/'
copyright = f'With love (♥) from {author}'
release = "2026.08.09"

extensions = [
	"sphinx.ext.autosectionlabel",
	"sphinxcontrib.httpdomain",
	"sphinxcontrib.httpexample",
]

autosectionlabel_prefix_document = True
httpexample_scheme = "https"

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

html_theme = 'classic'
html_extra_path = [".nojekyll"]
html_static_path = ['_static']
html_css_files = [
	'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.3.0/latin-400.css',
	'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.3.0/latin-400-italic.css',
	'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.3.0/latin-700.css',
	'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.3.0/latin-700-italic.css',
	'https://cdn.jsdelivr.net/npm/@fontsource/roboto-condensed@5.3.0/latin-400.css',
	'https://cdn.jsdelivr.net/npm/@fontsource/roboto-condensed@5.3.0/latin-400-italic.css',
	'https://cdn.jsdelivr.net/npm/@fontsource/roboto-condensed@5.3.0/latin-700.css',
	'https://cdn.jsdelivr.net/npm/@fontsource/roboto-condensed@5.3.0/latin-700-italic.css',
	'https://cdn.jsdelivr.net/npm/@fontsource/dejavu-mono@5.3.0/latin-400.css',
	'https://cdn.jsdelivr.net/npm/@fontsource/dejavu-mono@5.3.0/latin-400-italic.css',
	'https://cdn.jsdelivr.net/npm/@fontsource/dejavu-mono@5.3.0/latin-700.css',
	'https://cdn.jsdelivr.net/npm/@fontsource/dejavu-mono@5.3.0/latin-700-italic.css',
	'custom.css'
]

html_show_sphinx = False
html_use_index = False
html_baseurl = "https://echo-unvaulted.net/docs/"

pygments_style = 'monokai'
highlight_language = "json"
