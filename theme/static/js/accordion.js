function toggleAccordion(button) {
  var bio = document.getElementById(button.getAttribute('aria-controls'));
  var expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  bio.hidden = expanded;
}

document.querySelectorAll('.character-toggle').forEach(function (button) {
  button.addEventListener('click', function () {
    toggleAccordion(button);
  });
  button.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleAccordion(button);
    }
  });
});

document.querySelectorAll('time[datetime]').forEach(function (el) {
  var date = new Date(el.getAttribute('datetime'));
  if (!isNaN(date)) {
    el.textContent = date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }
});
