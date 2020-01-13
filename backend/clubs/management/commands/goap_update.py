import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand

from clubs.utils import clean, fuzzy_lookup_club


class Command(BaseCommand):
    help = "Updates cut off descriptions of groups on Penn Clubs using Groups Online @ Penn."
    START_URL = "https://upenn-community.symplicity.com/index.php?s=student_group"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            dest="dry_run",
            action="store_true",
            help="Do not actually import anything.",
        )
        parser.set_defaults(dry_run=False)

    def handle(self, *args, **kwargs):
        self.page_count, self.club_count = 1, 0
        self.dry_run = kwargs["dry_run"]
        self.session = requests.Session()
        self.agent = (
            "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
            + " Chrome/40.0.2214.85 Safari/537.36"
        )
        self.session.headers = {"User-Agent": self.agent}
        if self.dry_run:
            self.stdout.write("Not actually importing anything!")
        self.fix_clubs()

    def fix_clubs(self):
        self.clubs_to_scrape = []
        self.process_url(self.START_URL)
        for club, url in self.clubs_to_scrape:
            desc = self.extract_club_desc(url)
            if desc is None:
                continue
            club.description = clean(desc.text.strip())
            if not self.dry_run:
                club.save()
            self.stdout.write(f"Fixing club {club.name}.")
            self.club_count += 1
        self.stdout.write(f"Updated {self.club_count} clubs!")

    def extract_club_desc(self, url):
        club_page = self.session.get(url)
        club_page.raise_for_status()
        c_soup = BeautifulSoup(club_page.content, "html.parser")

        desc = c_soup.select_one(
            "#so_formfield_dnf_class_values_student_group__description_ .widget"
        )
        # If the description does not exist, then use the purpose instead.
        if desc is None:
            desc = c_soup.select_one(
                "#so_formfield_dnf_class_values_student_group__purpose_ .widget"
            )
        return desc

    def process_url(self, url):
        self.stdout.write(f"Processing Page {self.page_count}")
        self.page_count += 1
        base_url = url.split("?", 1)[0]
        resp = self.session.get(url)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.content, "html.parser")
        grps, next_tag = soup.select(".grpl .grpl-grp"), soup.find(text="Next >")
        for grp in grps:
            name = grp.select_one("h3 a").text.strip()
            club = fuzzy_lookup_club(name)

            # If the club exists in the db and the description has been shortened, add it to list
            if club is not None and club.description.endswith("…"):
                path = grp.select_one("h3 a")["href"]
                if path is None:
                    continue
                self.stdout.write(f"Adding club {club.name} to list.")
                self.clubs_to_scrape.append((club, f"{base_url}{path}&tab=profile"))
            else:
                self.stdout.write(self.style.WARNING(f"Club with name '{name}' does not exist!"))

        if next_tag is not None:
            resp = self.session.get(url)
            resp.raise_for_status()
            next_link = next_tag.find_parent("a")["href"]
            next_url = url.split("?", 1)[0] + next_link
            self.process_url(next_url)
