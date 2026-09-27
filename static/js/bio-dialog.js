var dialog = document.getElementById('bio-dialog');
var dialogBody = dialog.querySelector('.bio-dialog-body');

document.querySelectorAll('.bio-popup-trigger').forEach(function (link) {
  link.addEventListener('click', function (event) {
    event.preventDefault();
    var source = document.getElementById(link.getAttribute('data-bio-target'));
    dialogBody.innerHTML = source.querySelector('.bio-text').innerHTML;
    dialog.showModal();
  });
});

dialog.querySelector('.bio-dialog-close').addEventListener('click', function () {
  dialog.close();
});

dialog.addEventListener('click', function (event) {
  if (event.target === dialog) {
    dialog.close();
  }
});
