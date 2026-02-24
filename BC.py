import json
from rich import print
from rich.panel import Panel
from rich.console import Console
from rich.rule import Rule

console = Console()

try:
    with open("BC_Compendium.json", "r") as file:
        index = json.load(file)
except FileNotFoundError:
    print("Compendium file not found. Check the file path.")
    exit()

console.print(Panel("[bold red]Welcome to Black Company[/bold red]", style="white"),  justify="center")      

def sub(info): #handles individual subclasses + morale, black banner, commissary as lists with their features
    for x in index:
        if info == x.lower():
            console.print(Rule(f'[bold white]{info.title()}:[/bold white]', style="white"))
            print(f'{index[x]["description"]}\n')
            for y in index[x]['features']:
                console.print(Panel(f'[bold white]{y.title()}:[/bold white]', style="white"),  justify="left")
                print(f'  {index[x]["features"][y]["description"]:}\n')
        for y in index[x]:
            if info == y.lower():
                console.print(Rule(f'[bold white]{info.title()}[/bold white]', style="white"))
                console.print(Panel(f'{index[x][y]["description"]}', style="white"), justify="center")
                #console.print(Panel(Rule(f'[bold white]\n{info.title()}[/bold white]\n\n{index[x][y]["description"]}\n', style="white")),  justify="left")
                for feat in index[x][y]['features']:
                    console.print(Panel(f'[bold white]{feat.title()}:[/bold white]', style="white"),  justify="left")
                    print(f'Level: {index[x][y]["features"][feat]["level"]}')
                    print(f'  {index[x][y]["features"][feat]["description"]}\n')

def list_section(section): #handles lists of traits, quirks, subclasses (but no subclass info)
    for x in index[section]:
        console.print(Panel(f'[bold white]{x.title()}:[/bold white]', style="white"),  justify="left")
        print(f'{index[section][x]["description"]}\n')

def single_info(single): #handles searching individual quirks and traits
    for x in index:
        if single in index[x]:
            console.print(Panel(f'[bold white]{single.title()}[/bold white]', style="white"),  justify="left")
            console.print(f'{index[x][single]["description"]}')
                
while True:
    choice = input("Make a choice, or type quit: ").strip().lower()
    if choice == "quit":
        print("Did you know that Smalley and Oscar used to make love during their time in the navy? Ok, bye.")
        break
    elif choice in index["subclasses"]:
        sub(choice)
    elif choice == "traits" or choice == "quirks" or choice == "subclasses":
        list_section(choice)
    elif choice == "morale" or choice == "commissary" or choice == "black banner" or choice == "brothers":
        sub(choice)
    elif choice in index["traits"] or choice in index["quirks"]:
        single_info(choice)
    else:
        print("You, the user, absolutely fucked something up. This is not on me.")


