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
        $routes->post('logout', 'AuthController::logout');
        $routes->options('me', static function () {});
        $routes->options('login', static function () {});
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
        $routes->options('', static function () {});
    });

    // PayeeController Routes
    $routes->group('payees', static function ($routes) {
        $routes->get('', 'PayeeController::index');
        $routes->post('', 'PayeeController::create');
        $routes->get('(:segment)', 'PayeeController::show/$1');
        $routes->put('(:segment)', 'PayeeController::update/$1');
        $routes->delete('(:segment)', 'PayeeController::delete/$1');
        $routes->options('', static function () {});
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
});