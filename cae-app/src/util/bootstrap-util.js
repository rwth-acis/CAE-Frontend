export default class BootstrapUtil {
  static setupBootstrapTooltips(shadowRoot) {
    const tooltipTriggerList = [].slice.call(shadowRoot.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}