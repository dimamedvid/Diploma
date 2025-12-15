Feature: Search literary texts
  As a user
  I want to search literary works by title
  So that I can quickly find the text I am interested in

  Background:
    Given the user is on the home page "http://localhost:3000"

  Scenario Outline: Search literary works by title
    When the user enters "Кобзар" into the search field
    Then the number of found literary works should be updated