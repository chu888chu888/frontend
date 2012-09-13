with (scope('Issue', 'App')) {
  // determine if a developer has started working on a solution for the issue.
  // callback param is a boolean. returns the solution if dev created one, false otherwise
  define('get_solution', function(issue_number, callback) {
    if (!Storage.get('access_token')) return callback(false);
    BountySource.user_info(function(response) {
      var user_info = response.data||{};
      for (var i=0; user_info.solutions && i<user_info.solutions.length; i++) {
        if (parseInt(user_info.solutions[i].issue.number) == parseInt(issue_number)) return callback(user_info.solutions[i]);
      }
      callback(false);
    });
  });

  route('#repos/:login/:repository/issues/:issue_number', function(login, repository, issue_number) {
    var target_div = div('Loading...');


    render(
      breadcrumbs(
        a({ href: '#' }, 'Home'),
        a({ href: '#repos/' + login + '/' + repository }, login + '/' + repository),
        a({ href: '#repos/' + login + '/' + repository + '/issues' }, 'Issues'),
        '#' + issue_number
      ),

      target_div
    );

    BountySource.get_issue(login, repository, issue_number, function(response) {
      var issue = response.data||{};
      console.log(response)

      render({ into: target_div },
        div({ 'class': 'split-main' },

          h1({ style: 'font-size: 26px; line-height: 30px; font-weight: normal; color: #565656' }, 
            '#' + issue.number + ': ' + issue.title,
            span({ style: 'font-size: 16px; padding-left: 20px' },
              issue.state == 'open' ? span({ style: 'background: #83d11a; border-radius: 4px; padding: 4px; color: white' }, 'Open') : span({ style: 'background: #D11A1A; border-radius: 4px; padding: 4px; color: white' }, 'Closed')
            )
          ),
          
          github_user_html_box({ user: { login: issue.owner }, body_html: issue.body, created_at: issue.remote_created_at }),

          issue.comments.length > 0 && div(
            h2({ style: 'font-size: 26px; line-height: 30px; font-weight: normal; color: #565656' }, 'Comments'),
            issue.comments.map(github_user_html_box)
          )
          
          // issue.events.length > 0 && div(
          //   h2('Events'),
          //   issue.events.map(function(event) {
          //     return div({ style: 'border: 1px solid #888; padding: 5px; margin-bottom: 20px' }, 
          //       img({ src: event.actor.avatar_url, style: 'float: left; width:80px; height:80px' }), 
          //       b(event.actor.login), ' on ', event.created_at,
          //       div(event.event),
          //       div(event.commit_id),
          //       div({ style: 'clear: left' })
          //     );
          //   })
          // )
          
        ),

        div({ 'class': 'split-side' },
          bounty_box(issue),
          developer_box(issue)
          //misc_box(issue)
        ),

        div({ 'class': 'split-end' })
      );
    });
  });
  
  define('github_user_html_box', function(options) {
    return div({ style: 'margin-bottom: -1px' },
      img({ src: options.user.avatar_url || 'https://a248.e.akamai.net/assets.github.com/images/gravatars/gravatar-user-420.png', style: 'width: 50px; height: 50px; float: left' }),

      div({ 'class': 'github_html', style: 'margin-left: 70px; background: #f7f7f7; border-top: 1px solid #e3e3e3; border-bottom: 1px solid #e3e3e3; overflow: auto; padding: 10px;' },
        div({ style: 'color: #b4b4b4; margin-bottom: 6px' }, options.user.login, ' commented ', time_ago_in_words(options.created_at), ' ago:'),
      
        div({ html: options.body_html })
      )
    );
  });
  
  define('bounty_box', function(issue) {
    return div({ id: 'bounty-box' },
      div({ style: 'padding: 0 21px' }, ribbon_header("Backers")),
      
      issue.account_balance > 0 && section(
        div({ 'class': 'total_bounties' }, money(issue.account_balance)),
        div({ style: 'text-align: center' }, "From ", issue.bounties.length, " backer" + (issue.bounties.length == 1 ? '' : 's') + ".")
        
        
        // issue.bounties && (issue.bounties.length > 0) && div(
        //   issue.bounties.map(function(bounty) {
        //     return div(money(bounty.amount));
        //   })
        // )
      ),

      section({ style: 'padding: 21px' },
        shy_form_during_submit('Please wait...'),
        shy_form({ action: curry(create_bounty, issue.repository.owner, issue.repository.name, issue.number) },
          div({ id: 'errors' }),

          div({ 'class': 'amount' },
            label({ 'for': 'amount-input' }, '$'),
            text({ placeholder: "25.00", name: 'amount', id: 'amount-input' })
          ),
          div({ 'class': 'payment-method' },
            div(radio({ name: 'payment_method', value: 'paypal', checked: 'checked', id: 'payment_method_paypal' }), label({ 'for': 'payment_method_paypal' }, img({ src: 'images/paypal.png'}), "PayPal")),
            div(radio({ name: 'payment_method', value: 'google', id: 'payment_method_google' }), label({ 'for': 'payment_method_google' }, img({ src: 'images/google-wallet.png'}), "Google Wallet"))
          ),
          submit({ 'class': 'blue' }, 'Create Bounty')
        )
      )
    );
  });
  
  define('developer_box', function(issue) {
    var developer_div = div();

    get_solution(issue.number, function(solution) {
      if (solution) {
        render({ into: developer_div },
          a({ 'class': 'green', href: '#repos/'+issue.repository.owner+'/'+issue.repository.name+'/issues/'+issue.number+'/issue_branch' }, 'View Issue Branch')
        );
      } else {
        var advanced_box = div({ id: 'advanced-developer-box', style: "margin: 10px 0; display: none"}, 
          b('Name: '), text({ name: 'branch_name', value: 'issue'+issue.number, style: 'width: 100px' })
        );
        
        render({ into: developer_div },
          shy_form_during_submit(p({ style: 'text-align: center;' }, 'Creating Branch...')),

          shy_form({ action: curry(create_solution, issue.repository.owner, issue.repository.name, issue.number) },
            div({ id: 'errors', style: 'margin-bottom: 10px;' }),
            div('This will create a branch in GitHub for you to solve this issue.'),
            advanced_box,
            submit({ 'class': 'green', style: 'margin-top: 10px;' }, 'Create Issue Branch'),
            div({ style: 'text-align: right; font-size: 11px' }, '(', a({ href: curry(show, advanced_box) }, 'advanced'), ')')
          )
        );
      }
    });
    
    return div({ style: 'background: #f1f1f1; padding: 0 21px 21px 21px; margin: 20px 15px' },
      ribbon_header("Developers"),
      br(),
      developer_div
    );
  });
  
  define('misc_box', function(issue) {
    return div({ style: 'background: #e8f6f5; margin: 20px 15px'}, 
      h3('Fields'),
      div("Owner: ", issue.owner),
      div("Has code: ", issue.code ? 'Yes' : 'No'),
      issue.labels && issue.labels.length > 0 && div("Lables: ", ul(issue.labels))
    );
  });

  define('create_solution', function(login, repository, issue_number, form_data) {
    if (!Login.required()) return;

    BountySource.create_solution(login, repository, issue_number, form_data.branch_name, function(response) {
      if (response.meta.success) {
        set_route('#repos/'+login+'/'+repository+'/issues/'+issue_number+'/issue_branch');
      } else {
        show_shy_form();
        render({ into: 'errors' }, response.data.error);
      }
    });
  });

  define('create_bounty', function(login, repository, issue, form_data) {
    return BountySource.create_bounty(login, repository, issue, form_data.amount, form_data.payment_method, window.location.href, function(response) {
      if (response.meta.success) {
        window.location.href = response.data.redirect_url;
      } else {
        show_shy_form();
        render({ target: 'errors' }, div(response.data.error.join(', '), br()));
      }
    });
  });
};