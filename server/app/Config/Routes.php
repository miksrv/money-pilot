<?php

namespace Config;

use CodeIgniter\Router\RouteCollection;

$routes = Services::routes();

$routes->setDefaultNamespace('App\Controllers');
$routes->setDefaultController('Home');
$routes->setDefaultMethod('index');
$routes->setTranslateURIDashes(false);
$routes->set404Override();
$routes->setAutoRoute(false);

$routes->group('', ['namespace' => 'App\Controllers'], static function ($routes) {
    // AuthController Routes
    $routes->group('auth', static function ($routes) {
        $routes->get('me', 'AuthController::me');
        $routes->post('login', 'AuthController::login');
        $routes->get('logout', 'AuthController::logout');
        $routes->options('me', static function () {});
        $routes->options('login', static function () {});
        $routes->options('logout', static function () {});
    });

    // RegisterController Routes
    $routes->group('register', static function ($routes) {
        $routes->post('', 'RegisterController::create');
        $routes->options('', static function () {});
    });

    // AccountController Routes
    $routes->group('accounts', static function ($routes) {
        $routes->get('', 'AccountController::index');
        $routes->post('', 'AccountController::create');
        $routes->get('(:segment)', 'AccountController::show/$1');
        $routes->put('(:segment)', 'AccountController::update/$1');
        $routes->delete('(:segment)', 'AccountController::delete/$1');
        $routes->options('', static function () {});
    });

    // TransactionController Routes
    $routes->group('transactions', static function ($routes) {
        $routes->get('', 'TransactionController::index');
        $routes->post('', 'TransactionController::create');
        $routes->get('(:segment)', 'TransactionController::show/$1');
        $routes->put('(:segment)', 'TransactionController::update/$1');
        $routes->delete('(:segment)', 'TransactionController::delete/$1');
        $routes->options('', static function () {});
    });

    // CategoryController Routes
    $routes->group('categories', static function ($routes) {
        $routes->get('', 'CategoryController::index');
        $routes->post('', 'CategoryController::create');
        $routes->get('(:segment)', 'CategoryController::show/$1');
        $routes->put('(:segment)', 'CategoryController::update/$1');
        $routes->delete('(:segment)', 'CategoryController::delete/$1');
        $routes->patch('(:segment)/archive', 'CategoryController::archive/$1');
        $routes->options('/', static function () {});
        $routes->options('(:segment)', static function () {});
        $routes->options('(:segment)/archive', static function () {});
    });

    // PayeeController Routes
    $routes->group('payees', static function ($routes) {
        $routes->get('', 'PayeeController::index');
        $routes->post('', 'PayeeController::create');
        $routes->get('(:segment)', 'PayeeController::show/$1');
        $routes->put('(:segment)', 'PayeeController::update/$1');
        $routes->delete('(:segment)', 'PayeeController::delete/$1');
        $routes->post('(:segment)/merge', 'PayeeController::merge/$1');
        $routes->options('', static function () {});
        $routes->options('(:segment)', static function () {});
        $routes->options('(:segment)/merge', static function () {});
    });

    // GroupController Routes
    $routes->group('groups', static function ($routes) {
        $routes->get('', 'GroupController::index');
        $routes->post('', 'GroupController::create');
        $routes->get('(:segment)', 'GroupController::show/$1');
        $routes->put('(:segment)', 'GroupController::update/$1');
        $routes->delete('(:segment)', 'GroupController::delete/$1');
        $routes->post('(:segment)/invite', 'GroupController::invite/$1');
        $routes->post('(:segment)/members', 'GroupController::addMember/$1');
        $routes->options('', static function () {});
    });

    // UserController Routes
    $routes->group('users', static function ($routes) {
        $routes->get('profile', 'UserController::profile');
        $routes->put('profile', 'UserController::updateProfile');
        $routes->put('password', 'UserController::changePassword');
        $routes->delete('me', 'UserController::deleteMe');
        $routes->options('profile', static function () {});
        $routes->options('password', static function () {});
        $routes->options('me', static function () {});
    });

    // DashboardController Routes
    $routes->group('dashboard', static function ($routes) {
        $routes->get('summary', 'DashboardController::summary');
        $routes->options('summary', static function () {});
    });

    // RecurringController Routes
    $routes->group('recurring', static function ($routes) {
        $routes->get('', 'RecurringController::index');
        $routes->post('', 'RecurringController::create');
        $routes->put('(:segment)', 'RecurringController::update/$1');
        $routes->delete('(:segment)', 'RecurringController::delete/$1');
        $routes->post('(:segment)/generate', 'RecurringController::generate/$1');
        $routes->patch('(:segment)/toggle', 'RecurringController::toggle/$1');
        $routes->options('', static function () {});
        $routes->options('(:segment)', static function () {});
        $routes->options('(:segment)/generate', static function () {});
        $routes->options('(:segment)/toggle', static function () {});
    });

    // ReportsController Routes
    $routes->group('reports', static function ($routes) {
        $routes->get('spending-by-category', 'ReportsController::spendingByCategory');
        $routes->get('income-expense', 'ReportsController::incomeExpense');
        $routes->get('spending-trend', 'ReportsController::spendingTrend');
        $routes->get('net-worth', 'ReportsController::netWorth');
        $routes->get('top-payees', 'ReportsController::topPayees');
        $routes->options('spending-by-category', static function () {});
        $routes->options('income-expense', static function () {});
        $routes->options('spending-trend', static function () {});
        $routes->options('net-worth', static function () {});
        $routes->options('top-payees', static function () {});
    });
});