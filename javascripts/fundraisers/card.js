with (scope('Fundraiser', 'App')) {

  define('card', function(fundraiser, options) {
    options = options || {};
    options['class']  = 'card fundraiser';
    options.href      = options.href      || fundraiser.frontend_path;

    var funding_percentage = parseFloat(100 * (fundraiser.total_pledged / fundraiser.funding_goal));
    if (funding_percentage < 1) funding_percentage = 1;
    if (funding_percentage > 100) funding_percentage = 100;

    var image_element = div({ 'class': 'fundraiser-image' });
    image_element.style['background-image'] = 'url(' + (fundraiser.image_url || 'images/logo.png') + ')';

    var progress_bar_inner = div({ 'class': 'fundraiser-progress-bar-inner' });
    var progress_bar_div = div({ 'class': 'fundraiser-progress-bar-outer' }, progress_bar_inner);

    progress_bar_inner.style.width = funding_percentage + '%';

    return a({ 'class': 'card fundraiser', href: fundraiser.frontend_path },
      image_element,

      div({ 'class': 'fundraiser-text' },
        div({ 'class': 'fundraiser-title' }, fundraiser.title),
        div({ 'class': 'fundraiser-author' }, 'by ', fundraiser.person.display_name),
        div({ 'class': 'fundraiser-description' }, fundraiser.short_description)
      ),

      div({ 'class': 'fundraiser-stats' },
        div({ 'class': 'fundraiser-data' },
          span({ style: 'color: #00B900;' }, money(fundraiser.total_pledged)), ' raised',
          br,
          span({ style: 'color: #00B900;' }, formatted_number(fundraiser.days_remaining)), ' days left'
        ),

        div({ 'class': 'fundraiser-percentage' }, parseInt(funding_percentage), '%')
      ),

      progress_bar_div
    );
  });

  // try to support legacy cards
  define('fundraiser_card', function(fundraiser) { return card(fundraiser) });
}