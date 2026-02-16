workspace "Big Bank plc" "Example workspace for testing syntax highlighting" {

    !identifiers hierarchical

    model {
        // People
        customer = person "Personal Banking Customer" "A customer of the bank." {
            tags "Customer"
        }

        supportStaff = person "Customer Service Staff" "Handles customer inquiries."

        /*
         * Software Systems
         */
        internetBankingSystem = softwareSystem "Internet Banking System" "Allows customers to view bank accounts." {
            webApp = container "Web Application" "Delivers the SPA" "Java and Spring MVC" {
                signinController = component "Sign In Controller" "Allows users to sign in" "Spring MVC Controller"
                accountsController = component "Accounts Controller" "Provides account info" "Spring MVC Controller"
            }

            spa = container "Single-Page Application" "Provides banking functionality" "JavaScript and Angular" {
                tags "WebBrowser"
            }

            database = container "Database" "Stores user registration and account data" "Oracle 12c" {
                tags "Database"
            }

            webApp -> spa "Delivers to the customer's browser"
            spa -> database "Reads from and writes to" "JDBC"
        }

        mainframe = softwareSystem "Mainframe Banking System" "Stores core banking information." {
            tags "Existing System"
        }

        // Relationships
        customer -> internetBankingSystem "Views account balances using"
        customer -> supportStaff "Asks questions to"
        internetBankingSystem -> mainframe "Gets account information from"
    }

    views {
        systemLandscape "SystemLandscape" {
            include *
            autoLayout lr
        }

        systemContext internetBankingSystem "SystemContext" {
            include *
            autoLayout lr
        }

        container internetBankingSystem "Containers" {
            include *
            autoLayout tb
        }

        component webApp "Components" {
            include *
            autoLayout
        }

        styles {
            element "Person" {
                shape Person
                background #08427b
                color #ffffff
                fontSize 22
            }
            element "Database" {
                shape Cylinder
            }
            element "Existing System" {
                background #999999
                color #ffffff
            }
            element "WebBrowser" {
                shape WebBrowser
            }
            relationship "Relationship" {
                routing Orthogonal
                thickness 2
            }
        }
    }
}
