// One-time, run locally by a subscription Owner:
//   az deployment sub create -l westus2 -n devel-budget -f infra/budget.bicep
// Monthly cost alert for the whole subscription (blog + anything else in it).
targetScope = 'subscription'

@description('Monthly spend, in the billing currency, that the alerts are measured against.')
param amount int = 25

@description('Who gets the alert emails.')
param contactEmails array = [
  'smkim216@gmail.com'
]

@description('First day of the first budget month (yyyy-MM-01). Keep fixed; it cannot move after creation.')
param startDate string = '2026-10-01'

var notification = {
  enabled: true
  operator: 'GreaterThanOrEqualTo'
  contactEmails: contactEmails
}

resource budget 'Microsoft.Consumption/budgets@2024-08-01' = {
  name: 'budget-monthly'
  properties: {
    category: 'Cost'
    amount: amount
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: startDate
    }
    notifications: {
      actual80: union(notification, { threshold: 80, thresholdType: 'Actual' })
      actual100: union(notification, { threshold: 100, thresholdType: 'Actual' })
      forecast100: union(notification, { threshold: 100, thresholdType: 'Forecasted' })
    }
  }
}
