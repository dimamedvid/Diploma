Feature: User authentication
  As a registered user
  I want to log in to the system
  So that I can access the main content of the application

  Background:
    Given the user opens the application at "http://localhost:3000"

  Scenario: Successful login with valid credentials
    When the user navigates to the login page
    And the user enters login "poto7" and password "qqqq1111"
    And the user submits the login form
    Then the user should be redirected to the home page
    And the user should see the text "Результати пошуку"
