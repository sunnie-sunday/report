AUTHOR = '/xivg/'
SITENAME = 'Sunnie Sunday Report'
SITEURL = ''

PATH = 'content'
TIMEZONE = 'UTC'
DEFAULT_LANG = 'en'

THEME = 'theme'
COLOR_THEME = 'sonokai-dark'

PAGE_PATHS = ['characters', 'pages']
ARTICLE_PATHS = ['articles'] # Folder not required
STATIC_PATHS = ['images', 'characters']

# Render everything onto a single index.html instead of a paginated blog
DIRECT_TEMPLATES = ['index']
INDEX_SAVE_AS = 'index.html'
DEFAULT_PAGINATION = False

# No feeds needed for a single static roster page
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None
