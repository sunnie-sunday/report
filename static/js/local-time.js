document.querySelectorAll('time.local-time[datetime]').forEach(function (el) {
	var date = new Date(el.getAttribute('datetime'));
	if (!isNaN(date)) {
		el.textContent = date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
	}
});
